import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertFarmSchema, insertProduceItemSchema, insertOrderSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { stripeService } from "./services/stripe";
import { emailService } from "./services/email";

// Extend session interface
declare module "express-session" {
  interface SessionData {
    userId: number;
    userRole: string;
  }
}

// Session configuration
const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
const pgStore = connectPg(session);
const sessionStore = new pgStore({
  conString: process.env.DATABASE_URL,
  createTableIfMissing: false,
  ttl: sessionTtl,
  tableName: "sessions",
});

// Authentication middleware
interface AuthenticatedRequest extends Request {
  session: session.Session & Partial<session.SessionData> & {
    userId: number;
    userRole: string;
  };
}

const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

const requireRole = (role: string) => (req: any, res: any, next: any) => {
  if (!req.session?.userId || req.session?.userRole !== role) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "fallback-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  }));

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Set session
      req.session.userId = user.id;
      req.session.userRole = user.role;

      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      req.session.userId = user.id;
      req.session.userRole = user.role;

      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Produce routes
  app.get("/api/produce", async (req, res) => {
    try {
      const { query, category } = req.query;
      const items = await storage.searchProduceItems(
        query as string,
        category as string
      );
      res.json(items);
    } catch (error) {
      console.error("Get produce error:", error);
      res.status(500).json({ message: "Failed to get produce" });
    }
  });

  app.get("/api/produce/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getProduceItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Produce item not found" });
      }

      // Get inventory
      const inventory = await storage.getInventory(id);
      
      res.json({ ...item, inventory });
    } catch (error) {
      console.error("Get produce item error:", error);
      res.status(500).json({ message: "Failed to get produce item" });
    }
  });

  app.post("/api/produce", requireAuth, requireRole("farmer"), async (req, res) => {
    try {
      const itemData = insertProduceItemSchema.parse(req.body);
      const item = await storage.createProduceItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Create produce error:", error);
      res.status(500).json({ message: "Failed to create produce item" });
    }
  });

  // Farm routes
  app.get("/api/farms", async (req, res) => {
    try {
      const { query, filter } = req.query;
      
      // For now, get all farms (can be enhanced with search/filter logic)
      const farms = await storage.getFarms();
      
      let filteredFarms = farms;
      
      // Apply search filter
      if (query && typeof query === 'string') {
        filteredFarms = filteredFarms.filter((farm: Farm) => 
          farm.name.toLowerCase().includes(query.toLowerCase()) ||
          farm.description?.toLowerCase().includes(query.toLowerCase()) ||
          farm.city?.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      // Apply category filter
      if (filter && typeof filter === 'string') {
        filteredFarms = filteredFarms.filter((farm: Farm) => {
          switch (filter) {
            case 'organic':
              return farm.isOrganic;
            case 'family-owned':
              return farm.description?.toLowerCase().includes('family');
            case 'small-scale':
              return true; // All our farms are small-scale for demo
            case 'sustainable':
              return farm.description?.toLowerCase().includes('sustainable') || farm.isOrganic;
            default:
              return true;
          }
        });
      }
      
      res.json(filteredFarms);
    } catch (error) {
      console.error("Get farms error:", error);
      res.status(500).json({ message: "Failed to get farms" });
    }
  });

  app.get("/api/farms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const farm = await storage.getFarm(id);
      
      if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
      }

      const produce = await storage.getProduceItemsByFarm(id);
      
      res.json({ ...farm, produce });
    } catch (error) {
      console.error("Get farm error:", error);
      res.status(500).json({ message: "Failed to get farm" });
    }
  });

  app.post("/api/farms", requireAuth, requireRole("farmer"), async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const farmData = insertFarmSchema.parse({
        ...req.body,
        ownerId: userId,
      });
      const farm = await storage.createFarm(farmData);
      res.json(farm);
    } catch (error) {
      console.error("Create farm error:", error);
      res.status(500).json({ message: "Failed to create farm" });
    }
  });

  // Order routes
  app.get("/api/orders", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const orders = await storage.getOrdersByBuyer(userId);
      res.json(orders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  app.post("/api/orders", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const orderData = insertOrderSchema.parse({
        ...req.body,
        buyerId: userId,
      });

      // Create order
      const order = await storage.createOrder(orderData);

      // Create order items
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          await storage.createOrderItem({
            orderId: order.id,
            produceItemId: item.produceItemId,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            totalPrice: (item.quantity * item.pricePerUnit).toString(),
          });
        }
      }

      // Process payment with Stripe
      const paymentResult = await stripeService.createPaymentIntent(
        parseFloat(order.totalAmount.toString()),
        order.id
      );

      if (paymentResult.success) {
        await storage.updateOrder(order.id, {
          paymentIntentId: paymentResult.paymentIntentId,
        });
      }

      // Send confirmation email
      const user = await storage.getUser(userId);
      if (user?.email) {
        await emailService.sendOrderConfirmation(user.email, order);
      }

      res.json(order);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      // This is a simplified version - in production you'd want pagination
      res.json({ message: "Admin users endpoint - implement pagination" });
    } catch (error) {
      console.error("Get admin users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
