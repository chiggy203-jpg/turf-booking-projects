import { RequestHandler } from "express";
import crypto from "crypto";

// In-memory database (for demo purposes)
const users = new Map<
  string,
  {
    id: string;
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "user" | "admin";
  }
>();

const tokens = new Map<string, string>();

const hashPassword = (password: string): string => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

// Initialize with admin user
users.set("admin@greenfield.com", {
  id: "admin1",
  name: "Admin User",
  email: "admin@greenfield.com",
  phone: "9999999999",
  password: hashPassword("admin123"), // Hash the password during init
  role: "admin",
});

const generateToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const handleRegister: RequestHandler = (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }

  if (users.has(email)) {
    res.status(409).json({ message: "Email already exists" });
    return;
  }

  const userId = `user_${Date.now()}`;
  const hashedPassword = hashPassword(password);

  users.set(email, {
    id: userId,
    name,
    email,
    phone,
    password: hashedPassword,
    role: "user",
  });

  const token = generateToken();
  tokens.set(token, userId);

  res.json({
    token,
    userId,
    role: "user",
    message: "Registration successful",
  });
};

export const handleLogin: RequestHandler = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const user = users.get(email);

  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const hashedPassword = hashPassword(password);

  if (user.password !== hashedPassword) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const token = generateToken();
  tokens.set(token, user.id);

  res.json({
    token,
    userId: user.id,
    role: user.role,
    message: "Login successful",
  });
};

export const handleGetMe: RequestHandler = (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  const userId = tokens.get(token);

  if (!userId) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }

  let user = null;
  for (const u of users.values()) {
    if (u.id === userId) {
      user = u;
      break;
    }
  }

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  });
};

// Helper function to validate token
export const validateToken = (token: string | undefined): string | null => {
  if (!token) return null;
  const cleanToken = token.replace("Bearer ", "");
  return tokens.get(cleanToken) || null;
};

// Helper to get user by token
export const getUserByToken = (token: string | undefined) => {
  const userId = validateToken(token);
  console.log("[Auth] Token validation:", {
    tokenExists: !!token,
    tokenPreview: token?.substring(0, 30),
    userIdFound: !!userId,
    totalTokensInMap: tokens.size,
  });

  if (!userId) {
    console.log("[Auth] No user ID found for token");
    return null;
  }

  for (const user of users.values()) {
    if (user.id === userId) {
      console.log("[Auth] User found:", user.email);
      return user;
    }
  }
  console.log("[Auth] User ID found but no matching user");
  return null;
};

// Export users and tokens for other routes
export { users, tokens };
