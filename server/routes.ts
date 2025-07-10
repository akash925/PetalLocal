import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertFarmSchema, insertProduceItemSchema, insertOrderSchema, insertMessageSchema, type Farm } from "@shared/schema";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { stripeService } from "./services/stripe";
import { emailService } from "./services/email";
import { calculatePlatformFee } from "./config";

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
  console.log("Auth check - Session:", req.session);
  console.log("Auth check - User ID:", req.session?.userId);
  if (!req.session?.userId) {
    console.log("Auth failed - No userId in session");
    return res.status(401).json({ message: "Unauthorized" });
  }
  console.log("Auth passed for user:", req.session.userId);
  next();
};

const requireRole = (role: string) => (req: any, res: any, next: any) => {
  console.log(`Role check for '${role}' - User role:`, req.session?.userRole);
  if (!req.session?.userId || req.session?.userRole !== role) {
    console.log(`Role check failed - Required: ${role}, Got: ${req.session?.userRole}`);
    return res.status(403).json({ message: "Forbidden" });
  }
  console.log(`Role check passed for '${role}'`);
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
      
      // Get farm information
      const farm = await storage.getFarm(item.farmId);
      
      res.json({ ...item, inventory, farm });
    } catch (error) {
      console.error("Get produce item error:", error);
      res.status(500).json({ message: "Failed to get produce item" });
    }
  });

  app.post("/api/produce", requireAuth, requireRole("farmer"), async (req: any, res) => {
    try {
      console.log("Creating produce with data:", req.body);
      console.log("User session:", req.session);
      
      const itemData = insertProduceItemSchema.parse(req.body);
      console.log("Validated data:", itemData);
      
      const item = await storage.createProduceItem(itemData);
      console.log("Created produce item:", item);
      
      res.json(item);
    } catch (error) {
      console.error("Create produce error:", error);
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create produce item" });
      }
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

  app.get("/api/farms/owned/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const farms = await storage.getFarmsByOwner(userId);
      res.json(farms);
    } catch (error) {
      console.error("Get owned farms error:", error);
      res.status(500).json({ message: "Failed to get owned farms" });
    }
  });

  app.post("/api/farms", requireAuth, requireRole("farmer"), async (req: any, res) => {
    try {
      console.log("Creating farm with data:", req.body);
      console.log("User session:", req.session);
      
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const farmData = insertFarmSchema.parse({
        ...req.body,
        ownerId: userId,
      });
      console.log("Validated farm data:", farmData);
      
      const farm = await storage.createFarm(farmData);
      console.log("Created farm:", farm);
      
      res.json(farm);
    } catch (error) {
      console.error("Create farm error:", error);
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create farm" });
      }
    }
  });

  app.put("/api/farms/:id", requireAuth, requireRole("farmer"), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if farm exists and belongs to user
      const existingFarm = await storage.getFarm(id);
      if (!existingFarm) {
        return res.status(404).json({ message: "Farm not found" });
      }
      
      if (existingFarm.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const farmData = insertFarmSchema.partial().parse(req.body);
      const updatedFarm = await storage.updateFarm(id, farmData);
      
      res.json(updatedFarm);
    } catch (error) {
      console.error("Update farm error:", error);
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update farm" });
      }
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



  // Stripe payment routes
  app.post("/api/create-payment-intent", requireAuth, async (req: any, res) => {
    try {
      const { amount, items = [] } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Calculate platform fee using configurable rate
      const { platformFee, farmerAmount } = calculatePlatformFee(amount);

      console.log(`[PAYMENT] Total: $${amount}, Platform Fee: $${platformFee.toFixed(2)}, Farmer Gets: $${farmerAmount.toFixed(2)}`);

      const paymentResult = await stripeService.createPaymentIntent(amount, 0);
      
      if (paymentResult.success) {
        res.json({ 
          clientSecret: paymentResult.clientSecret,
          platformFee: platformFee.toFixed(2),
          farmerAmount: farmerAmount.toFixed(2)
        });
      } else {
        res.status(500).json({ message: paymentResult.error || "Failed to create payment intent" });
      }
    } catch (error) {
      console.error("Create payment intent error:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
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
  app.get("/api/admin/users", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.get("/api/admin/farms", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      const farms = await storage.getAllFarmsWithOwners();
      res.json(farms);
    } catch (error) {
      console.error("Get all farms error:", error);
      res.status(500).json({ message: "Failed to get farms" });
    }
  });

  app.get("/api/admin/produce", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      const produce = await storage.getAllProduceWithFarms();
      res.json(produce);
    } catch (error) {
      console.error("Get all produce error:", error);
      res.status(500).json({ message: "Failed to get produce" });
    }
  });

  app.get("/api/admin/orders", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      const orders = await storage.getAllOrdersWithBuyers();
      res.json(orders);
    } catch (error) {
      console.error("Get all orders error:", error);
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  app.get("/api/admin/config", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      const config = {
        platformFeeRate: process.env.PLATFORM_FEE_RATE ? parseFloat(process.env.PLATFORM_FEE_RATE) : 0.10,
      };
      res.json(config);
    } catch (error) {
      console.error("Get admin config error:", error);
      res.status(500).json({ message: "Failed to get config" });
    }
  });

  app.put("/api/admin/config", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      const { platformFeeRate } = req.body;
      
      if (platformFeeRate && (platformFeeRate < 0 || platformFeeRate > 1)) {
        return res.status(400).json({ message: "Platform fee rate must be between 0 and 1" });
      }

      // In a production environment, you'd want to persist this to a config table
      // For now, we'll just return success (the environment variable would need to be updated)
      res.json({ message: "Configuration updated successfully", platformFeeRate });
    } catch (error) {
      console.error("Update admin config error:", error);
      res.status(500).json({ message: "Failed to update config" });
    }
  });

  app.put("/api/admin/users/:id", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      const user = await storage.updateUser(userId, { isActive });
      res.json(user);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get("/api/admin/analytics", async (req: any, res) => {
    try {
      // Return empty analytics for now - frontend calculates from other data
      res.json({});
    } catch (error) {
      console.error("Get admin analytics error:", error);
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  // Message routes
  app.get("/api/messages", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const messages = await storage.getMessagesByUser(userId);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.get("/api/messages/conversation/:userId", requireAuth, async (req: any, res) => {
    try {
      const currentUserId = req.session?.userId;
      const otherUserId = parseInt(req.params.userId);
      
      if (!currentUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const messages = await storage.getConversation(currentUserId, otherUserId);
      res.json(messages);
    } catch (error) {
      console.error("Get conversation error:", error);
      res.status(500).json({ message: "Failed to get conversation" });
    }
  });

  app.post("/api/messages", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: userId,
      });
      
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.put("/api/messages/:id/read", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      const messageId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const message = await storage.markMessageAsRead(messageId);
      res.json(message);
    } catch (error) {
      console.error("Mark message as read error:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.get("/api/messages/unread-count", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
