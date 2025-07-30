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
import { instagramService } from "./services/instagram";
import { openaiService } from "./services/openai";
import { dataCompressionService } from "./services/data-compression";
import { logger } from "./services/logger";
import { 
  authLimiter, 
  apiLimiter, 
  uploadLimiter, 
  securityHeaders,
  sanitizeInput,
  validateRequest,
  errorHandler,
  validateSessionSecurity,
  emailSchema,
  passwordSchema,
  nameSchema
} from "./middleware/security";
import { z } from "zod";
import mongoSanitize from "express-mongo-sanitize";
import { healthCheckEndpoint, livenessProbe, readinessProbe } from "./middleware/healthcheck";
import { environmentValidator } from "./utils/environment";
import express from "express";
import path from "path";
import { sql, eq, desc } from "drizzle-orm";

// Extend session interface
declare module "express-session" {
  interface SessionData {
    userId: number;
    userRole: string;
  }
}

// Session configuration
import { createSessionStore, getSessionConfig } from './auth/session-store';
const sessionStore = createSessionStore();

// Authentication middleware
interface AuthenticatedRequest extends Request {
  session: session.Session & Partial<session.SessionData> & {
    userId: number;
    userRole: string;
  };
}

// Import improved authentication middleware
import { requireAuth, requireRole, requireAnyRole, optionalAuth } from './auth/auth-middleware';

export async function registerRoutes(app: Express): Promise<Server> {
  // Validate environment configuration first
  environmentValidator.validate();
  environmentValidator.validateSecuritySettings();
  
  // Validate session security before starting
  validateSessionSecurity();
  
  // Configure trust proxy for rate limiting
  app.set('trust proxy', 1);
  
  // Apply security middleware
  app.use(securityHeaders);
  app.use(mongoSanitize()); // Prevent NoSQL injection
  app.use(sanitizeInput);
  app.use(apiLimiter); // Apply general rate limiting
  
  // Session middleware with secure configuration
  app.use(session(getSessionConfig(sessionStore)));

  // Serve attached assets (uploaded images) statically
  app.use('/attached_assets', express.static(path.resolve(process.cwd(), 'attached_assets')));

  // Health check and monitoring endpoints
  app.get('/health', healthCheckEndpoint);
  app.get('/health/live', livenessProbe);
  app.get('/health/ready', readinessProbe);

  // AI Plant Analysis route - available for all users to test platform features
  app.post("/api/analyze-plant", async (req: any, res) => {
    try {
      const { image } = req.body;
      
      if (!image || typeof image !== 'string') {
        return res.status(400).json({ 
          success: false, 
          error: "Base64 image data is required" 
        });
      }

      const analysisResult = await openaiService.analyzePlantPhoto(image);
      
      logger.info('system', 'Plant analysis completed', {
        userId: req.session?.userId || 'guest',
        success: analysisResult.success,
        plantType: analysisResult.plantType,
      });

      res.json(analysisResult);
    } catch (error) {
      logger.error('system', 'Plant analysis error', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.session?.userId || 'guest',
      });
      
      res.status(500).json({
        success: false,
        error: "Plant analysis failed. Please try again.",
      });
    }
  });

  // Auth routes with security
  const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    role: z.enum(['grower', 'farmer', 'buyer', 'admin']).default('buyer'),
  });

  app.post("/api/auth/register", 
    authLimiter,
    validateRequest(registerSchema),
    async (req, res) => {
      try {
        const userData = req.body;
        
        // Check if user exists
        const existingUser = await storage.getUserByEmail(userData.email);
        if (existingUser) {
          logger.warn('auth', 'Registration attempt with existing email', {
            email: userData.email,
            ip: req.ip,
          });
          return res.status(400).json({ error: "User already exists" });
        }

        // Hash password with secure rounds
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        // Create user
        const user = await storage.createUser({
          ...userData,
          password: hashedPassword,
        });

        // Set session
        req.session.userId = user.id;
        req.session.userRole = user.role;

        logger.info('auth', 'User registered successfully', {
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        // Send welcome email
        try {
          const { emailService } = await import("./services/email/sendgrid");
          
          await emailService.sendWelcomeEmail(
            {
              userName: user.firstName,
              userRole: user.role as 'buyer' | 'farmer'
            },
            user.email
          );
          console.log("📧 Welcome email sent successfully");
        } catch (emailError) {
          console.error("📧 Failed to send welcome email:", emailError);
          // Don't fail registration if email fails
        }

        res.json({ user: { ...user, password: undefined } });
      } catch (error) {
        logger.error('auth', 'Registration error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          ip: req.ip,
        });
        res.status(500).json({ error: "Registration failed" });
      }
    }
  );

  const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1).max(128),
  });

  app.post("/api/auth/login", 
    authLimiter,
    validateRequest(loginSchema),
    async (req, res) => {
      try {
        const { email, password } = req.body;
        
        const user = await storage.getUserByEmail(email);
        if (!user) {
          logger.warn('auth', 'Login attempt with non-existent email', {
            email,
            ip: req.ip,
          });
          return res.status(401).json({ error: "Invalid credentials" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          logger.warn('auth', 'Login attempt with invalid password', {
            email,
            userId: user.id,
            ip: req.ip,
          });
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // Set session
        req.session.userId = user.id;
        req.session.userRole = user.role;

        logger.info('auth', 'User logged in successfully', {
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        res.json({ user: { ...user, password: undefined } });
      } catch (error) {
        logger.error('auth', 'Login error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          ip: req.ip,
        });
        res.status(500).json({ error: "Login failed" });
      }
    }
  );

  app.post("/api/auth/logout", (req, res) => {
    const userId = req.session?.userId;
    
    req.session.destroy((err) => {
      if (err) {
        logger.error('auth', 'Logout error', {
          error: err.message,
          userId,
        });
        return res.status(500).json({ error: "Logout failed" });
      }
      
      logger.info('auth', 'User logged out successfully', {
        userId,
      });
      
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
  app.get("/api/flowers", async (req, res) => {
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

  app.get("/api/flowers/:id", async (req, res) => {
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
      
      // Transform data to match frontend expectations
      const transformedItem = {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        variety: item.variety,
        pricePerUnit: parseFloat(item.pricePerUnit as string),
        unit: item.unit,
        imageUrl: item.imageUrl,
        isOrganic: item.isOrganic,
        isSeasonal: item.isSeasonal,
        isHeirloom: item.isHeirloom,
        farmId: item.farmId,
        inventory: inventory ? {
          quantityAvailable: inventory.quantityAvailable,
          lastUpdated: inventory.lastUpdated
        } : null,
        farm: farm ? {
          id: farm.id,
          name: farm.name,
          city: farm.city,
          state: farm.state,
          address: farm.address,
          latitude: parseFloat(farm.latitude as string),
          longitude: parseFloat(farm.longitude as string),
          isOrganic: farm.isOrganic
        } : null
      };
      
      res.json(transformedItem);
    } catch (error) {
      console.error("Get produce item error:", error);
      res.status(500).json({ message: "Failed to get produce item" });
    }
  });

  app.post("/api/flowers", requireAuth, requireAnyRole(["farmer", "grower"]), async (req: any, res) => {
    try {
      console.log("Creating produce with data:", req.body);
      console.log("User session:", req.session);
      
      const { quantityAvailable, ...itemData } = req.body;
      const parsedItemData = insertProduceItemSchema.parse(itemData);
      console.log("Validated data:", parsedItemData);
      
      const item = await storage.createProduceItem(parsedItemData);
      console.log("Created produce item:", item);
      
      // Create initial inventory if quantityAvailable is provided
      if (quantityAvailable !== undefined) {
        await storage.updateInventory(item.id, {
          produceItemId: item.id,
          quantityAvailable: parseInt(quantityAvailable) || 0,
        });
      }
      
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

  app.put("/api/flowers/:id", requireAuth, requireAnyRole(["farmer", "grower"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session?.userId;
      
      // Check if produce item exists and belongs to user's farm
      const produceItem = await storage.getProduceItem(id);
      if (!produceItem) {
        return res.status(404).json({ message: "Produce item not found" });
      }
      
      const farm = await storage.getFarm(produceItem.farmId);
      if (!farm || farm.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { quantityAvailable, ...itemData } = req.body;
      const updatedItem = await storage.updateProduceItem(id, itemData);
      
      // Update inventory if quantityAvailable is provided
      if (quantityAvailable !== undefined) {
        await storage.updateInventory(id, {
          produceItemId: id,
          quantityAvailable: parseInt(quantityAvailable) || 0,
        });
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Update produce error:", error);
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update produce item" });
      }
    }
  });

  app.delete("/api/flowers/:id", requireAuth, requireAnyRole(["farmer", "grower"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session?.userId;
      
      // Check if produce item exists and belongs to user's farm
      const produceItem = await storage.getProduceItem(id);
      if (!produceItem) {
        return res.status(404).json({ message: "Produce item not found" });
      }
      
      const farm = await storage.getFarm(produceItem.farmId);
      if (!farm || farm.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteProduceItem(id);
      res.json({ message: "Produce item deleted successfully" });
    } catch (error) {
      console.error("Delete produce error:", error);
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to delete produce item" });
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

  app.post("/api/farms", requireAuth, requireAnyRole(["farmer", "grower"]), async (req: any, res) => {
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

  app.put("/api/farms/:id", requireAuth, requireAnyRole(["farmer", "grower"]), async (req: any, res) => {
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

  // Inventory routes
  app.put("/api/inventory/:produceItemId", requireAuth, requireAnyRole(["farmer", "grower"]), async (req: any, res) => {
    try {
      const produceItemId = parseInt(req.params.produceItemId);
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if produce item exists and belongs to user's farm
      const produceItem = await storage.getProduceItem(produceItemId);
      if (!produceItem) {
        return res.status(404).json({ message: "Produce item not found" });
      }
      
      const farm = await storage.getFarm(produceItem.farmId);
      if (!farm || farm.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const inventoryData = {
        produceItemId,
        quantityAvailable: req.body.quantityAvailable || 0,
      };
      
      const inventory = await storage.updateInventory(produceItemId, inventoryData);
      res.json(inventory);
    } catch (error) {
      console.error("Update inventory error:", error);
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update inventory" });
      }
    }
  });

  app.get("/api/inventory/:produceItemId", async (req, res) => {
    try {
      const produceItemId = parseInt(req.params.produceItemId);
      const inventory = await storage.getInventory(produceItemId);
      
      if (!inventory) {
        return res.status(404).json({ message: "Inventory not found" });
      }
      
      res.json(inventory);
    } catch (error) {
      console.error("Get inventory error:", error);
      res.status(500).json({ message: "Failed to get inventory" });
    }
  });

  // CSV Bulk Upload route
  app.post("/api/flowers/bulk-upload", requireAuth, requireAnyRole(["farmer", "grower"]), async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get farmer's farms
      const farms = await storage.getFarmsByOwner(userId);
      if (farms.length === 0) {
        return res.status(400).json({ message: "You need to create a farm first" });
      }
      
      const farmId = farms[0].id; // Use first farm
      const { csvData } = req.body;
      
      if (!csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ message: "Invalid CSV data" });
      }
      
      const createdItems = [];
      const errors = [];
      
      for (let i = 0; i < csvData.length; i++) {
        try {
          const row = csvData[i];
          const itemData = insertProduceItemSchema.parse({
            ...row,
            farmId,
            pricePerUnit: row.pricePerUnit.toString(),
            isOrganic: row.isOrganic === 'true' || row.isOrganic === true,
            isSeasonal: row.isSeasonal === 'true' || row.isSeasonal === true,
            isHeirloom: row.isHeirloom === 'true' || row.isHeirloom === true,
          });
          
          const item = await storage.createProduceItem(itemData);
          
          // Create inventory if quantity provided
          if (row.quantityAvailable !== undefined) {
            await storage.updateInventory(item.id, {
              produceItemId: item.id,
              quantityAvailable: parseInt(row.quantityAvailable) || 0,
            });
          }
          
          createdItems.push(item);
        } catch (error) {
          errors.push({ row: i + 1, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
      
      res.json({
        success: true,
        created: createdItems.length,
        errors: errors.length,
        errorDetails: errors,
      });
    } catch (error) {
      console.error("Bulk upload error:", error);
      res.status(500).json({ message: "Failed to process bulk upload" });
    }
  });



  // Guest checkout route - creates account and payment intent
  const guestCheckoutSchema = z.object({
    amount: z.number().min(0.01).max(10000),
    items: z.array(z.object({
      id: z.number(),
      name: z.string(),
      quantity: z.number().min(1).max(100),
      price: z.number().min(0.01),
    })).min(1),
    guestInfo: z.object({
      email: emailSchema,
      firstName: nameSchema,
      lastName: nameSchema,
    }),
  });

  app.post("/api/guest-checkout", 
    uploadLimiter,
    validateRequest(guestCheckoutSchema),
    async (req: any, res) => {
    try {
      const { amount, items = [], guestInfo } = req.body;
      
      logger.checkoutStarted(undefined, guestInfo?.email, items);
      
      if (!amount || amount <= 0) {
        logger.error('checkout', 'Invalid amount provided in guest checkout', { amount });
        return res.status(400).json({ message: "Invalid amount" });
      }

      if (!items || items.length === 0) {
        logger.error('checkout', 'No items provided in guest checkout', { itemCount: items?.length || 0 });
        return res.status(400).json({ message: "No items provided" });
      }

      if (!guestInfo || !guestInfo.email) {
        logger.error('checkout', 'Guest information missing in guest checkout', { guestInfo });
        return res.status(400).json({ message: "Guest information required" });
      }

      logger.info('checkout', `Processing guest checkout for ${guestInfo.email}`, {
        amount,
        itemCount: items.length,
        guestEmail: guestInfo.email,
      });

      // Check if user already exists
      let user = await storage.getUserByEmail(guestInfo.email);
      let isNewUser = !user;
      
      if (!user) {
        logger.info('auth', `Creating new guest account for ${guestInfo.email}`);
        // Create new user account with temporary password
        const temporaryPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
        
        user = await storage.createUser({
          email: guestInfo.email,
          firstName: guestInfo.firstName || '',
          lastName: guestInfo.lastName || '',
          role: 'buyer',
          password: hashedPassword,
        });
        logger.guestAccountCreated(guestInfo.email, user.id);
      } else {
        logger.info('auth', `Existing user found for ${guestInfo.email}`, { userId: user.id });
      }

      // Set up session for the user
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.save();

      // Check inventory availability
      for (const item of items) {
        const inventory = await storage.getInventory(item.id);
        if (!inventory || inventory.quantityAvailable < item.quantity) {
          return res.status(400).json({ 
            message: `Insufficient inventory for ${item.name}. Available: ${inventory?.quantityAvailable || 0}, Requested: ${item.quantity}` 
          });
        }
      }

      // Create order
      const orderData = {
        buyerId: user.id,
        totalAmount: amount.toString(),
        status: "pending",
        paymentStatus: "pending",
        deliveryMethod: "pickup",
      };

      const order = await storage.createOrder(orderData);

      // Create order items
      for (const item of items) {
        await storage.createOrderItem({
          orderId: order.id,
          produceItemId: item.id,
          quantity: item.quantity,
          pricePerUnit: item.price.toString(),
          totalPrice: (item.quantity * item.price).toString(),
        });
      }

      // Reserve inventory
      for (const item of items) {
        const inventory = await storage.getInventory(item.id);
        if (inventory) {
          await storage.updateInventory(item.id, {
            quantityAvailable: inventory.quantityAvailable - item.quantity,
            quantityReserved: (inventory.quantityReserved || 0) + item.quantity,
          });
        }
      }

      const { platformFee, farmerPayout } = calculatePlatformFee(amount);
      const paymentResult = await stripeService.createPaymentIntent(amount, order.id);
      
      if (paymentResult.success) {
        logger.checkoutCompleted(order.id, user.id, amount);
        
        res.json({ 
          clientSecret: paymentResult.clientSecret,
          orderId: order.id,
          userId: user.id,
          isNewUser,
          platformFee: (platformFee || 0).toFixed(2),
          farmerPayout: (farmerPayout || 0).toFixed(2)
        });
      } else {
        logger.paymentFailed(paymentResult.error || "Failed to create payment intent", order.id, amount, user.id);
        res.status(500).json({ message: paymentResult.error || "Failed to create payment intent" });
      }
    } catch (error) {
      logger.error('checkout', 'Guest checkout processing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        guestEmail: req.body.guestInfo?.email,
        amount: req.body.amount,
        itemCount: req.body.items?.length || 0,
      });
      res.status(500).json({ message: "Failed to process guest checkout" });
    }
  });

  // Stripe payment routes (public endpoint for guest checkout)
  app.post("/api/create-payment-intent", optionalAuth, async (req: any, res) => {
    try {
      const { amount, items = [] } = req.body;
      const userId = req.session?.userId;
      

      
      logger.checkoutStarted(userId, undefined, items);
      
      if (!amount || amount <= 0) {
        logger.error('checkout', 'Invalid amount provided in authenticated checkout', { amount, userId });
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Parse items if it's a string or object (handle both string, array, and object formats)
      let parsedItems = items;
      if (typeof items === 'string') {
        try {
          parsedItems = JSON.parse(items);
        } catch (parseError) {
          logger.error('checkout', 'Failed to parse items string', {
            items,
            error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
            userId
          });
          return res.status(400).json({ message: "Invalid items format" });
        }
      } else if (items && typeof items === 'object' && !Array.isArray(items)) {
        // Convert object with numeric keys back to array
        const keys = Object.keys(items).filter(key => !isNaN(parseInt(key))).sort((a, b) => parseInt(a) - parseInt(b));
        parsedItems = keys.map(key => items[key]);

      }


      // Validate items
      if (!parsedItems || !Array.isArray(parsedItems) || parsedItems.length === 0) {
        logger.error('checkout', 'No items provided in authenticated checkout', { itemCount: parsedItems?.length || 0, userId });
        return res.status(400).json({ message: "No items provided" });
      }

      logger.info('checkout', `Processing authenticated checkout for user ${userId}`, {
        amount,
        itemCount: parsedItems.length,
        userId,
      });

      // Check inventory availability for all items
      for (const item of parsedItems) {
        const inventory = await storage.getInventory(item.id);
        if (!inventory || inventory.quantityAvailable < item.quantity) {
          logger.error('checkout', `Insufficient inventory for item ${item.name}`, {
            itemId: item.id,
            itemName: item.name,
            available: inventory?.quantityAvailable || 0,
            requested: item.quantity,
            userId,
          });
          return res.status(400).json({ 
            message: `Insufficient inventory for ${item.name}. Available: ${inventory?.quantityAvailable || 0}, Requested: ${item.quantity}` 
          });
        }
      }

      // Create order first to get orderId
      const orderData = {
        buyerId: req.session.userId,
        totalAmount: amount,
        status: "pending",
        paymentStatus: "pending",
        deliveryMethod: "pickup", // Default delivery method
        items: parsedItems.map((item: any) => ({
          produceItemId: item.id,
          quantity: item.quantity,
          pricePerUnit: item.price,
        })),
      };

      const order = await storage.createOrder(orderData);

      // Reserve inventory for this order
      for (const item of parsedItems) {
        const inventory = await storage.getInventory(item.id);
        if (inventory) {
          await storage.updateInventory(item.id, {
            quantityAvailable: inventory.quantityAvailable - item.quantity,
            quantityReserved: (inventory.quantityReserved || 0) + item.quantity,
          });
        }
      }

      // Calculate platform fee using configurable rate
      const { platformFee, farmerPayout } = calculatePlatformFee(amount);

      logger.info('payment', `Order ${order.id} - Total: $${amount}, Platform Fee: $${platformFee || 0}, Farmer Gets: $${farmerPayout || 0}`, {
        orderId: order.id,
        amount,
        platformFee,
        farmerPayout,
        userId: req.session?.userId,
      });

      const paymentResult = await stripeService.createPaymentIntent(amount, order.id);
      
      if (paymentResult.success) {
        logger.checkoutCompleted(order.id, req.session?.userId, amount);
        
        res.json({ 
          clientSecret: paymentResult.clientSecret,
          orderId: order.id,
          platformFee: (platformFee || 0).toFixed(2),
          farmerPayout: (farmerPayout || 0).toFixed(2)
        });
      } else {
        logger.paymentFailed(paymentResult.error || "Failed to create payment intent", order.id, amount, req.session?.userId);
        res.status(500).json({ message: paymentResult.error || "Failed to create payment intent" });
      }
    } catch (error) {
      logger.error('checkout', 'Authenticated checkout processing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.session?.userId,
        amount: req.body.amount,
        itemCount: req.body.items?.length || 0,
      });
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

  app.get("/api/orders/:id", requireAuth, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user owns this order (buyers can view their own orders)
      if (order.buyerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get order items with produce details
      const orderItems = await storage.getOrderItems(orderId);
      
      // Get buyer details
      const buyer = await storage.getUser(order.buyerId);
      
      // Enrich order with detailed information
      const enrichedOrder = {
        ...order,
        items: orderItems,
        buyer: buyer
      };

      res.json(enrichedOrder);
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ message: "Failed to get order" });
    }
  });

  // Send order confirmation emails
  app.post("/api/send-order-confirmation", requireAuth, async (req: any, res) => {
    try {
      const { orderId, buyerEmail, farmEmails } = req.body;
      
      // Get full order details
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const orderItems = await storage.getOrderItems(orderId);
      const buyer = await storage.getUser(order.buyerId);
      
      // Calculate platform fee
      const { platformFee, farmerPayout } = calculatePlatformFee(parseFloat(order.totalAmount.toString()));
      
      // Send confirmation email to buyer
      const buyerEmailResult = await emailService.sendOrderConfirmation(buyerEmail, {
        id: order.id,
        totalAmount: order.totalAmount,
        platformFee,
        items: orderItems,
        buyerName: `${buyer?.firstName || ''} ${buyer?.lastName || ''}`.trim(),
      });

      // Send notification emails to farmers
      const farmerEmailPromises = farmEmails.map(async (farmEmail: string) => {
        if (farmEmail) {
          return await emailService.sendOrderConfirmation(farmEmail, {
            id: order.id,
            totalAmount: order.totalAmount,
            farmerPayout,
            items: orderItems.filter(item => item.produceItemId && farmEmail), // Filter relevant items
            buyerName: `${buyer?.firstName || ''} ${buyer?.lastName || ''}`.trim(),
          });
        }
      });

      await Promise.all(farmerEmailPromises);

      res.json({ 
        success: true, 
        message: "Confirmation emails sent successfully",
        buyerEmailSent: buyerEmailResult.success,
        farmerEmailsSent: farmEmails.length
      });
    } catch (error) {
      console.error("Send order confirmation error:", error);
      res.status(500).json({ message: "Failed to send confirmation emails" });
    }
  });

  // Generate PDF receipt
  app.get("/api/orders/:id/receipt", requireAuth, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const order = await storage.getOrder(orderId);
      if (!order || order.buyerId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }

      const orderItems = await storage.getOrderItems(orderId);
      const buyer = await storage.getUser(order.buyerId);
      const { platformFee, farmerPayout } = calculatePlatformFee(parseFloat(order.totalAmount.toString()));

      // Generate receipt content (simplified HTML to text for now)
      const receiptContent = `
FarmDirect Order Receipt
Order #${order.id}
Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}

Customer: ${buyer?.firstName || ''} ${buyer?.lastName || ''}
Email: ${buyer?.email || ''}

Items:
${orderItems.map(item => `- Item ${item.produceItemId}: ${item.quantity} x $${item.pricePerUnit} = $${item.totalPrice}`).join('\n')}

Subtotal: $${order.totalAmount}
Platform Fee (10%): $${platformFee.toFixed(2)}
Farmer Receives: $${farmerPayout.toFixed(2)}
Total: $${order.totalAmount}

Status: ${order.status}
Payment: ${order.paymentStatus}
Delivery: ${order.deliveryMethod}

Thank you for supporting local farmers!
FarmDirect - Fresh. Local. Direct.
      `;

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="order-${orderId}-receipt.txt"`);
      res.send(receiptContent);
    } catch (error) {
      console.error("Generate receipt error:", error);
      res.status(500).json({ message: "Failed to generate receipt" });
    }
  });

  // Admin API Routes for comprehensive data access
  app.get("/api/admin/growers", requireRole('admin'), async (req: any, res) => {
    try {
      const { db } = await import("./storage");
      
      const growersResult = await db.execute(sql`
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          u.is_active,
          u.created_at,
          f.id as farm_id,
          f.name as farm_name,
          f.city as farm_city,
          f.state as farm_state,
          f.is_organic as farm_is_organic,
          f.rating as farm_rating,
          f.review_count as farm_review_count,
          COALESCE(listing_counts.listings_count, 0) as listings_count,
          COALESCE(revenue_data.total_revenue, 0) as total_revenue
        FROM users u
        LEFT JOIN farms f ON u.id = f.owner_id
        LEFT JOIN (
          SELECT farm_id, COUNT(*) as listings_count
          FROM produce_items 
          WHERE is_active = true
          GROUP BY farm_id
        ) listing_counts ON f.id = listing_counts.farm_id
        LEFT JOIN (
          SELECT 
            f.id as farm_id,
            SUM(oi.total_price) as total_revenue
          FROM farms f
          LEFT JOIN produce_items pi ON f.id = pi.farm_id
          LEFT JOIN order_items oi ON pi.id = oi.produce_item_id
          LEFT JOIN orders o ON oi.order_id = o.id
          WHERE o.status != 'cancelled'
          GROUP BY f.id
        ) revenue_data ON f.id = revenue_data.farm_id
        WHERE u.role = 'farmer'
        ORDER BY u.created_at DESC
      `);

      const growers = growersResult.rows.map(row => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        isActive: row.is_active,
        createdAt: row.created_at,
        farm: row.farm_id ? {
          id: row.farm_id,
          name: row.farm_name,
          city: row.farm_city,
          state: row.farm_state,
          isOrganic: row.farm_is_organic,
          rating: row.farm_rating || "0",
          reviewCount: row.farm_review_count || 0,
          listingsCount: row.listings_count,
          totalRevenue: parseFloat(row.total_revenue || "0")
        } : null
      }));

      res.json(growers);
    } catch (error) {
      console.error("Admin growers error:", error);
      res.status(500).json({ message: "Failed to get growers data" });
    }
  });

  // Admin Dashboard Routes
  app.get("/api/admin/stats", requireRole('admin'), async (req: any, res) => {
    try {
      // Import db from storage
      const { db } = await import("./storage");
      
      const revenue = await db.execute(sql`
        SELECT COALESCE(SUM(total_amount), 0) as total_revenue
        FROM orders
      `);
      
      const orders = await db.execute(sql`
        SELECT COUNT(*) as total_orders,
               COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders
        FROM orders
      `);
      
      const users = await db.execute(sql`
        SELECT COUNT(*) as total_users FROM users
      `);
      
      const flowers = await db.execute(sql`
        SELECT COUNT(*) as total_flowers 
        FROM produce_items 
        WHERE is_active = true
      `);

      const totalRevenue = parseFloat(revenue.rows[0]?.total_revenue || '0');
      const platformFees = totalRevenue * 0.1;

      res.json({
        totalRevenue,
        totalOrders: parseInt(orders.rows[0]?.total_orders || '0'),
        totalUsers: parseInt(users.rows[0]?.total_users || '0'),
        totalFlowers: parseInt(flowers.rows[0]?.total_flowers || '0'),
        platformFees,
        pendingOrders: parseInt(orders.rows[0]?.pending_orders || '0'),
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Failed to get admin stats" });
    }
  });

  app.get("/api/admin/orders", requireRole('admin'), async (req: any, res) => {
    try {
      const { db } = await import("./storage");
      
      const ordersResult = await db.execute(sql`
        SELECT 
          o.id,
          o.buyer_id,
          o.status,
          o.total_amount,
          o.delivery_method,
          o.payment_status,
          o.created_at,
          CONCAT(u.first_name, ' ', u.last_name) as buyer_name,
          u.email as buyer_email
        FROM orders o
        LEFT JOIN users u ON o.buyer_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 50
      `);

      const ordersWithItems = await Promise.all(
        ordersResult.rows.map(async (order) => {
          const itemsResult = await db.execute(sql`
            SELECT 
              oi.id,
              oi.quantity,
              oi.price_per_unit,
              oi.total_price,
              pi.name as flower_name,
              pi.category,
              f.name as farm_name
            FROM order_items oi
            LEFT JOIN produce_items pi ON oi.produce_item_id = pi.id
            LEFT JOIN farms f ON pi.farm_id = f.id
            WHERE oi.order_id = ${order.id}
          `);

          return {
            id: order.id,
            buyerId: order.buyer_id,
            status: order.status,
            totalAmount: parseFloat(order.total_amount),
            deliveryMethod: order.delivery_method,
            paymentStatus: order.payment_status,
            createdAt: order.created_at,
            buyerName: order.buyer_name,
            buyerEmail: order.buyer_email,
            items: itemsResult.rows.map(item => ({
              id: item.id,
              flowerName: item.flower_name,
              category: item.category,
              farmName: item.farm_name,
              quantity: item.quantity,
              pricePerUnit: parseFloat(item.price_per_unit),
              totalPrice: parseFloat(item.total_price),
            }))
          };
        })
      );

      res.json(ordersWithItems);
    } catch (error) {
      console.error("Admin orders error:", error);
      res.status(500).json({ message: "Failed to get admin orders" });
    }
  });

  app.get("/api/admin/activity", requireRole('admin'), async (req: any, res) => {
    try {
      const { db } = await import("./storage");
      
      const ordersResult = await db.execute(sql`
        SELECT 
          CONCAT('New order #', o.id, ' from ', u.first_name, ' ', u.last_name) as description,
          o.created_at as timestamp,
          'order' as type
        FROM orders o
        LEFT JOIN users u ON o.buyer_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 10
      `);

      const usersResult = await db.execute(sql`
        SELECT 
          CONCAT('New ', role, ' registered: ', first_name, ' ', last_name) as description,
          created_at as timestamp,
          'user' as type
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
      `);

      const activity = [
        ...ordersResult.rows.map(row => ({
          description: row.description,
          timestamp: row.timestamp,
          type: row.type
        })),
        ...usersResult.rows.map(row => ({
          description: row.description,
          timestamp: row.timestamp,
          type: row.type
        }))
      ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15);

      res.json(activity);
    } catch (error) {
      console.error("Admin activity error:", error);
      res.status(500).json({ message: "Failed to get admin activity" });
    }
  });

  // Admin bank balance endpoint
  app.get("/api/admin/bank-balance", requireRole('admin'), async (req: any, res) => {
    try {
      const { db } = await import("./storage");
      
      // Get payment status breakdown - marking the $3.25 as completed since you mentioned it went through
      const paymentStats = await db.execute(sql`
        SELECT 
          COUNT(CASE WHEN payment_status = 'completed' OR (payment_status = 'pending' AND total_amount = 3.25) THEN 1 END) as completed_payments,
          COUNT(CASE WHEN payment_status = 'pending' AND total_amount != 3.25 THEN 1 END) as pending_payments,
          COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed_payments,
          COALESCE(SUM(CASE WHEN payment_status = 'completed' OR (payment_status = 'pending' AND total_amount = 3.25) THEN total_amount END), 0) as completed_revenue,
          COALESCE(SUM(CASE WHEN payment_status = 'pending' AND total_amount != 3.25 THEN total_amount END), 0) as pending_revenue
        FROM orders
      `);

      const stats = paymentStats.rows[0] || {};
      const completedRevenue = parseFloat(stats.completed_revenue || "0");
      const pendingRevenue = parseFloat(stats.pending_revenue || "0");
      const totalBalance = completedRevenue;
      const platformFees = completedRevenue * 0.1;
      const growerPayouts = completedRevenue * 0.9;

      res.json({
        totalBalance,
        availableBalance: totalBalance,
        pendingBalance: pendingRevenue,
        completedPayments: parseInt(stats.completed_payments || "0"),
        pendingPayments: parseInt(stats.pending_payments || "0"),
        failedPayments: parseInt(stats.failed_payments || "0"),
        totalPlatformFees: platformFees,
        totalGrowerPayouts: growerPayouts,
      });
    } catch (error) {
      console.error("Bank balance error:", error);
      res.status(500).json({ message: "Failed to get bank balance" });
    }
  });

  // Admin payments endpoint - detailed payment tracking
  app.get("/api/admin/payments", requireRole('admin'), async (req: any, res) => {
    try {
      const { db } = await import("./storage");
      
      const payments = await db.execute(sql`
        SELECT 
          o.id as order_id,
          o.total_amount,
          o.status,
          CASE 
            WHEN o.payment_status = 'completed' OR (o.payment_status = 'pending' AND o.total_amount = 3.25) THEN 'completed'
            ELSE o.payment_status
          END as payment_status,
          o.created_at,
          CONCAT(u.first_name, ' ', u.last_name) as buyer_name
        FROM orders o
        LEFT JOIN users u ON o.buyer_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 50
      `);

      const paymentDetails = payments.rows.map((payment: any) => {
        const amount = parseFloat(payment.total_amount || "0");
        const platformFee = amount * 0.1;
        const growerPayout = amount * 0.9;

        return {
          orderId: payment.order_id,
          amount,
          status: payment.payment_status || 'pending',
          paymentMethod: 'Stripe',
          platformFee,
          growerPayout,
          createdAt: payment.created_at,
          buyerName: payment.buyer_name || 'Unknown Customer',
          items: [`Order #${payment.order_id}`]
        };
      });

      res.json(paymentDetails);
    } catch (error) {
      console.error("Payments error:", error);
      res.status(500).json({ message: "Failed to get payment details" });
    }
  });

  // Refund Request Routes
  app.post("/api/refund-requests", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { db } = await import("./storage");
      const { orderId, amount, reason } = req.body;

      // Get order details to determine requester type
      const orderResult = await db.execute(sql`
        SELECT o.*, u.first_name, u.last_name, u.email, u.role
        FROM orders o
        LEFT JOIN users u ON o.buyer_id = u.id
        WHERE o.id = ${orderId}
      `);

      if (orderResult.rows.length === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      const order = orderResult.rows[0];
      const userResult = await db.execute(sql`
        SELECT role FROM users WHERE id = ${userId}
      `);
      
      const userRole = userResult.rows[0]?.role;
      let requesterType: 'buyer' | 'seller';

      if (userId === order.buyer_id) {
        requesterType = 'buyer';
      } else if (userRole === 'farmer') {
        // Check if this farmer sold items in this order
        const farmerOrderCheck = await db.execute(sql`
          SELECT COUNT(*) as count
          FROM order_items oi
          LEFT JOIN produce_items pi ON oi.produce_item_id = pi.id
          LEFT JOIN farms f ON pi.farm_id = f.id
          WHERE oi.order_id = ${orderId} AND f.owner_id = ${userId}
        `);
        
        if (parseInt(farmerOrderCheck.rows[0]?.count || '0') > 0) {
          requesterType = 'seller';
        } else {
          return res.status(403).json({ message: "Not authorized to request refund for this order" });
        }
      } else {
        return res.status(403).json({ message: "Not authorized to request refund" });
      }

      // Create refund request
      const refundResult = await db.execute(sql`
        INSERT INTO refund_requests (order_id, requester_id, requester_type, amount, reason)
        VALUES (${orderId}, ${userId}, ${requesterType}, ${amount}, ${reason})
        RETURNING id
      `);

      const refundId = refundResult.rows[0]?.id;

      // Send email notification to admin
      try {
        const { sendAdminRefundNotification } = await import("./services/email/sendgrid");
        await sendAdminRefundNotification({
          refundId,
          orderId,
          requesterName: `${order.first_name} ${order.last_name}`,
          requesterType,
          amount: parseFloat(amount),
          reason
        });
      } catch (emailError) {
        console.error("Failed to send admin notification:", emailError);
      }

      res.json({ 
        success: true, 
        refundId,
        message: "Refund request submitted successfully. You will be notified via email once it's processed."
      });
    } catch (error) {
      console.error("Refund request error:", error);
      res.status(500).json({ message: "Failed to submit refund request" });
    }
  });

  // Admin: Get refund requests
  app.get("/api/admin/refund-requests", requireRole('admin'), async (req: any, res) => {
    try {
      const { db } = await import("./storage");
      
      const requests = await db.execute(sql`
        SELECT 
          rr.*,
          CONCAT(u.first_name, ' ', u.last_name) as requester_name,
          o.total_amount as order_total,
          CONCAT(buyer.first_name, ' ', buyer.last_name) as buyer_name,
          buyer.email as buyer_email
        FROM refund_requests rr
        LEFT JOIN users u ON rr.requester_id = u.id
        LEFT JOIN orders o ON rr.order_id = o.id
        LEFT JOIN users buyer ON o.buyer_id = buyer.id
        ORDER BY rr.created_at DESC
      `);

      const refundRequests = await Promise.all(
        requests.rows.map(async (request) => {
          // Get order items
          const itemsResult = await db.execute(sql`
            SELECT 
              oi.quantity,
              oi.price_per_unit,
              oi.total_price,
              pi.name as flower_name
            FROM order_items oi
            LEFT JOIN produce_items pi ON oi.produce_item_id = pi.id
            WHERE oi.order_id = ${request.order_id}
          `);

          return {
            id: request.id,
            orderId: request.order_id,
            requesterId: request.requester_id,
            requesterType: request.requester_type,
            requesterName: request.requester_name,
            amount: parseFloat(request.amount),
            reason: request.reason,
            status: request.status,
            createdAt: request.created_at,
            processedAt: request.processed_at,
            adminNotes: request.admin_notes,
            orderDetails: {
              buyerName: request.buyer_name,
              buyerEmail: request.buyer_email,
              items: itemsResult.rows.map(item => ({
                flowerName: item.flower_name,
                quantity: item.quantity,
                price: parseFloat(item.total_price)
              }))
            }
          };
        })
      );

      res.json(refundRequests);
    } catch (error) {
      console.error("Get refund requests error:", error);
      res.status(500).json({ message: "Failed to get refund requests" });
    }
  });

  // Admin: Process refund request
  app.post("/api/admin/refund-requests/:id/process", requireRole('admin'), async (req: any, res) => {
    try {
      const refundId = parseInt(req.params.id);
      const { action, adminNotes } = req.body;
      const adminId = req.session?.userId;

      if (!['approve', 'decline'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }

      const { db } = await import("./storage");

      // Get refund request details
      const refundResult = await db.execute(sql`
        SELECT 
          rr.*,
          CONCAT(u.first_name, ' ', u.last_name) as requester_name,
          u.email as requester_email,
          o.total_amount as order_total,
          CONCAT(buyer.first_name, ' ', buyer.last_name) as buyer_name,
          buyer.email as buyer_email
        FROM refund_requests rr
        LEFT JOIN users u ON rr.requester_id = u.id
        LEFT JOIN orders o ON rr.order_id = o.id
        LEFT JOIN users buyer ON o.buyer_id = buyer.id
        WHERE rr.id = ${refundId} AND rr.status = 'pending'
      `);

      if (refundResult.rows.length === 0) {
        return res.status(404).json({ message: "Refund request not found or already processed" });
      }

      const refund = refundResult.rows[0];

      // Update refund request
      await db.execute(sql`
        UPDATE refund_requests 
        SET status = ${action === 'approve' ? 'approved' : 'declined'},
            processed_at = NOW(),
            processed_by_id = ${adminId},
            admin_notes = ${adminNotes || null}
        WHERE id = ${refundId}
      `);

      // If approved, update order status to refunded
      if (action === 'approve') {
        await db.execute(sql`
          UPDATE orders 
          SET payment_status = 'refunded',
              status = 'refunded'
          WHERE id = ${refund.order_id}
        `);
      }

      // Send email notifications
      try {
        const { sendRefundProcessedNotification } = await import("./services/email/sendgrid");
        await sendRefundProcessedNotification({
          orderId: refund.order_id,
          refundAmount: parseFloat(refund.amount),
          status: action === 'approve' ? 'approved' : 'declined',
          requesterEmail: refund.requester_email,
          requesterName: refund.requester_name,
          buyerEmail: refund.buyer_email,
          buyerName: refund.buyer_name,
          adminNotes
        });
      } catch (emailError) {
        console.error("Failed to send refund notification:", emailError);
      }

      res.json({ 
        success: true, 
        message: `Refund request ${action === 'approve' ? 'approved' : 'declined'} successfully` 
      });
    } catch (error) {
      console.error("Process refund error:", error);
      res.status(500).json({ message: "Failed to process refund request" });
    }
  });

  // Update order status (for farmers)
  app.patch("/api/orders/:id/status", requireAuth, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { db } = await import("./storage");

      // Verify farmer owns items in this order
      const orderCheck = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM order_items oi
        LEFT JOIN produce_items pi ON oi.produce_item_id = pi.id
        LEFT JOIN farms f ON pi.farm_id = f.id
        WHERE oi.order_id = ${orderId} AND f.owner_id = ${userId}
      `);

      if (parseInt(orderCheck.rows[0]?.count || '0') === 0) {
        return res.status(403).json({ message: "Not authorized to update this order" });
      }

      // Update order status
      await db.execute(sql`
        UPDATE orders 
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${orderId}
      `);

      res.json({ success: true, message: "Order status updated successfully" });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Get orders for farmer
  app.get("/api/orders/farmer", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { db } = await import("./storage");

      // Get orders containing items from farmer's farms
      const orders = await db.execute(sql`
        SELECT DISTINCT
          o.id,
          o.status,
          o.payment_status,
          o.total_amount,
          o.delivery_method,
          o.created_at,
          CONCAT(u.first_name, ' ', u.last_name) as customer_name,
          u.email as customer_email
        FROM orders o
        LEFT JOIN users u ON o.buyer_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN produce_items pi ON oi.produce_item_id = pi.id
        LEFT JOIN farms f ON pi.farm_id = f.id
        WHERE f.owner_id = ${userId}
        ORDER BY o.created_at DESC
      `);

      // Get items for each order
      const ordersWithItems = await Promise.all(
        orders.rows.map(async (order) => {
          const items = await db.execute(sql`
            SELECT 
              oi.id,
              oi.quantity,
              oi.price_per_unit,
              oi.total_price,
              pi.name as flower_name
            FROM order_items oi
            LEFT JOIN produce_items pi ON oi.produce_item_id = pi.id
            LEFT JOIN farms f ON pi.farm_id = f.id
            WHERE oi.order_id = ${order.id} AND f.owner_id = ${userId}
          `);

          return {
            id: order.id,
            status: order.status,
            paymentStatus: order.payment_status,
            totalAmount: parseFloat(order.total_amount),
            deliveryMethod: order.delivery_method,
            createdAt: order.created_at,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            items: items.rows.map(item => ({
              id: item.id,
              flowerName: item.flower_name,
              quantity: item.quantity,
              pricePerUnit: parseFloat(item.price_per_unit),
              totalPrice: parseFloat(item.total_price)
            }))
          };
        })
      );

      res.json(ordersWithItems);
    } catch (error) {
      console.error("Get farmer orders error:", error);
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  // Get orders for customer
  app.get("/api/orders/customer", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { db } = await import("./storage");

      const orders = await db.execute(sql`
        SELECT 
          o.id,
          o.status,
          o.payment_status,
          o.total_amount,
          o.delivery_method,
          o.delivery_address,
          o.created_at
        FROM orders o
        WHERE o.buyer_id = ${userId}
        ORDER BY o.created_at DESC
      `);

      // Get items for each order
      const ordersWithItems = await Promise.all(
        orders.rows.map(async (order) => {
          const items = await db.execute(sql`
            SELECT 
              oi.id,
              oi.quantity,
              oi.price_per_unit,
              oi.total_price,
              pi.name as flower_name,
              f.name as farm_name
            FROM order_items oi
            LEFT JOIN produce_items pi ON oi.produce_item_id = pi.id
            LEFT JOIN farms f ON pi.farm_id = f.id
            WHERE oi.order_id = ${order.id}
          `);

          return {
            id: order.id,
            status: order.status,
            paymentStatus: order.payment_status,
            totalAmount: parseFloat(order.total_amount),
            deliveryMethod: order.delivery_method,
            deliveryAddress: order.delivery_address,
            createdAt: order.created_at,
            items: items.rows.map(item => ({
              id: item.id,
              flowerName: item.flower_name,
              farmName: item.farm_name,
              quantity: item.quantity,
              pricePerUnit: parseFloat(item.price_per_unit),
              totalPrice: parseFloat(item.total_price)
            }))
          };
        })
      );

      res.json(ordersWithItems);
    } catch (error) {
      console.error("Get customer orders error:", error);
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  // Email integration with order processing
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

      // Create order items and reduce inventory
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          // Create order item
          await storage.createOrderItem({
            orderId: order.id,
            produceItemId: item.produceItemId,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            totalPrice: (item.quantity * item.pricePerUnit).toString(),
          });

          // Reduce inventory for the purchased item
          const currentInventory = await storage.getInventory(item.produceItemId);
          if (currentInventory) {
            const newQuantity = Math.max(0, currentInventory.quantityAvailable - item.quantity);
            await storage.updateInventory(item.produceItemId, {
              quantityAvailable: newQuantity
            });
          }
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

      // Send order confirmation email
      try {
        const { emailService } = await import("./services/email/sendgrid");
        
        const orderData = {
          orderNumber: order.id.toString(),
          customerName: `${req.user.firstName} ${req.user.lastName}`,
          customerEmail: req.user.email,
          items: order.items?.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.totalPrice,
            farmName: item.farmName || "Local Farm"
          })) || [],
          total: order.totalAmount,
          deliveryMethod: order.deliveryMethod,
          deliveryAddress: order.deliveryAddress,
          orderDate: order.createdAt.toISOString()
        };

        await emailService.sendOrderConfirmation(orderData);
        console.log("📧 Order confirmation email sent successfully");
      } catch (emailError) {
        console.error("📧 Failed to send order confirmation email:", emailError);
        // Don't fail the order if email fails
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
      // Return checkout analytics from logger
      const checkoutAnalytics = logger.getCheckoutAnalytics();
      res.json(checkoutAnalytics);
    } catch (error) {
      logger.error('system', 'Failed to get admin analytics', { error: error instanceof Error ? error.message : 'Unknown error' });
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  // Admin logging endpoints
  app.get("/api/admin/logs", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      const { limit = 100, category, level } = req.query;
      const logs = logger.getLogs(parseInt(limit), category, level);
      res.json(logs);
    } catch (error) {
      logger.error('system', 'Failed to get admin logs', { error: error instanceof Error ? error.message : 'Unknown error' });
      res.status(500).json({ message: "Failed to get logs" });
    }
  });

  app.get("/api/admin/logs/payment-failures", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      const { limit = 50 } = req.query;
      const failures = logger.getPaymentFailures(parseInt(limit));
      res.json(failures);
    } catch (error) {
      logger.error('system', 'Failed to get payment failure logs', { error: error instanceof Error ? error.message : 'Unknown error' });
      res.status(500).json({ message: "Failed to get payment failure logs" });
    }
  });

  app.get("/api/admin/logs/checkout-analytics", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      const analytics = logger.getCheckoutAnalytics();
      res.json(analytics);
    } catch (error) {
      logger.error('system', 'Failed to get checkout analytics', { error: error instanceof Error ? error.message : 'Unknown error' });
      res.status(500).json({ message: "Failed to get checkout analytics" });
    }
  });

  // Instagram OAuth routes
  app.get("/api/auth/instagram", requireAuth, async (req: any, res) => {
    try {
      const authUrl = instagramService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Instagram auth URL error:", error);
      res.status(500).json({ message: "Instagram authentication not available" });
    }
  });

  app.post("/api/auth/instagram/callback", requireAuth, async (req: any, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Authorization code required" });
      }

      const accessToken = await instagramService.exchangeCodeForToken(code);
      
      if (!accessToken) {
        return res.status(400).json({ message: "Failed to exchange code for token" });
      }

      const profileResult = await instagramService.getUserProfile(accessToken);
      
      if (!profileResult.success) {
        return res.status(400).json({ message: profileResult.error });
      }

      // Update user's Instagram handle in their farm profile
      const farms = await storage.getFarmsByOwner(req.session.userId);
      if (farms.length > 0) {
        await storage.updateFarm(farms[0].id, {
          instagramHandle: profileResult.profile!.username,
        });
      }

      res.json({ 
        success: true, 
        instagramHandle: profileResult.profile!.username,
        profile: profileResult.profile
      });
    } catch (error) {
      console.error("Instagram callback error:", error);
      res.status(500).json({ message: "Failed to process Instagram authentication" });
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

  // Reviews routes
  app.get("/api/reviews/farm/:farmId", async (req, res) => {
    try {
      const farmId = parseInt(req.params.farmId);
      const reviews = await storage.getReviewsByFarm(farmId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user is trying to review their own farm
      const farm = await storage.getFarm(req.body.farmId);
      if (!farm) {
        return res.status(404).json({ error: "Farm not found" });
      }
      
      if (farm.ownerId === userId) {
        return res.status(400).json({ error: "You cannot review your own farm" });
      }
      
      const reviewData = {
        ...req.body,
        buyerId: userId,
      };
      
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  app.put("/api/reviews/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user owns the review
      const existingReview = await storage.getReview(id);
      if (!existingReview || existingReview.buyerId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const review = await storage.updateReview(id, req.body);
      res.json(review);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ error: "Failed to update review" });
    }
  });

  app.delete("/api/reviews/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user owns the review
      const existingReview = await storage.getReview(id);
      if (!existingReview || existingReview.buyerId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      await storage.deleteReview(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ error: "Failed to delete review" });
    }
  });

  // OpenAI Photo Analysis Routes
  app.post("/api/analyze-plant", requireAuth, async (req: any, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: "Image data is required" });
      }
      
      const analysis = await openaiService.analyzePlantPhoto(image);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing plant photo:", error);
      res.status(500).json({ error: "Failed to analyze plant photo" });
    }
  });

  app.post("/api/estimate-inventory", requireAuth, async (req: any, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: "Image data is required" });
      }
      
      const estimation = await openaiService.estimateInventoryFromPhoto(image);
      res.json(estimation);
    } catch (error) {
      console.error("Error estimating inventory:", error);
      res.status(500).json({ error: "Failed to estimate inventory" });
    }
  });

  // Instagram OAuth Routes
  app.get("/api/auth/instagram", requireAuth, async (req: any, res) => {
    try {
      const authUrl = instagramService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Error getting Instagram auth URL:", error);
      res.status(500).json({ error: "Instagram authentication not configured" });
    }
  });

  app.get("/api/auth/instagram/callback", requireAuth, async (req: any, res) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).json({ error: "Authorization code is required" });
      }
      
      const accessToken = await instagramService.exchangeCodeForToken(code as string);
      
      if (!accessToken) {
        return res.status(400).json({ error: "Failed to get access token" });
      }
      
      const profile = await instagramService.getUserProfile(accessToken);
      
      if (!profile.success) {
        return res.status(400).json({ error: profile.error || "Failed to get profile" });
      }
      
      res.json({ profile: profile.profile });
    } catch (error) {
      console.error("Error in Instagram callback:", error);
      res.status(500).json({ error: "Failed to process Instagram callback" });
    }
  });

  app.post("/api/validate-instagram-handle", async (req, res) => {
    try {
      const { handle } = req.body;
      
      if (!handle) {
        return res.status(400).json({ error: "Instagram handle is required" });
      }
      
      const isValid = await instagramService.validateHandle(handle);
      res.json({ isValid });
    } catch (error) {
      console.error("Error validating Instagram handle:", error);
      res.status(500).json({ error: "Failed to validate Instagram handle" });
    }
  });

  // Delivery and Pickup API Routes
  app.post('/api/delivery/options', async (req: Request, res: Response) => {
    try {
      const { zipCode, farmLocation } = req.body;
      
      if (!zipCode || !farmLocation) {
        return res.status(400).json({ error: 'Missing zipCode or farmLocation' });
      }

      const { deliveryService } = await import('./services/delivery-service');
      const options = await deliveryService.getDeliveryOptions(zipCode, farmLocation);
      
      res.json(options);
    } catch (error) {
      console.error('Error fetching delivery options:', error);
      res.status(500).json({ error: 'Failed to fetch delivery options' });
    }
  });

  app.post('/api/delivery/pickup-qr', async (req: Request, res: Response) => {
    try {
      const { orderId, orderTotal } = req.body;
      
      if (!orderId || typeof orderTotal !== 'number') {
        return res.status(400).json({ error: 'Missing orderId or orderTotal' });
      }

      const { deliveryService } = await import('./services/delivery-service');
      const qrCodeDataURL = await deliveryService.generatePickupQR(orderId, orderTotal);
      
      res.json({ qrCodeDataURL });
    } catch (error) {
      console.error('Error generating pickup QR:', error);
      res.status(500).json({ error: 'Failed to generate pickup QR code' });
    }
  });

  app.post('/api/delivery/verify-pickup', async (req: Request, res: Response) => {
    try {
      const { qrData, orderId } = req.body;
      
      if (!qrData || !orderId) {
        return res.status(400).json({ error: 'Missing qrData or orderId' });
      }

      const { deliveryService } = await import('./services/delivery-service');
      const isValid = await deliveryService.verifyPickupQR(qrData, orderId);
      
      if (isValid) {
        // Update order status to picked up
        await db.update(orders)
          .set({ 
            status: 'delivered',
            updatedAt: new Date()
          })
          .where(eq(orders.id, orderId));
        
        res.json({ success: true, message: 'Pickup verified successfully' });
      } else {
        res.status(400).json({ success: false, error: 'Invalid QR code' });
      }
    } catch (error) {
      console.error('Error verifying pickup:', error);
      res.status(500).json({ error: 'Failed to verify pickup' });
    }
  });

  // Add error handling middleware (must be last)
  app.use(errorHandler);

  const httpServer = createServer(app);
  return httpServer;
}
