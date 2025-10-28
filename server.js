import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { z } from "zod";

dotenv.config();

const app = express();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 5 * 60 * 1000, // 5 minutes - just for OAuth flow
    },
    // Use memory store only for OAuth flow, not for persistent sessions
    name: 'oauth.session',
  })
);

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(3, "Name is required"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password is required"),
});

const postSchema = z.object({
  title: z.string().min(3, "Title is required"),
  content: z.string().min(12, "Content is required"),
});

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.errors,
    });
  }
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_, __, profile, done) => {
      try {
        console.log("Google profile received:", profile.emails?.[0]?.value);
        let { data: user } = await supabase
          .from("users")
          .select("*")
          .eq("email", profile.emails?.[0]?.value)
          .single();

        if (!user) {
          console.log("Creating new user...");
          const { data: newUser, error } = await supabase
            .from("users")
            .insert([
              {
                email: profile.emails?.[0]?.value,
                name: profile.displayName,
                password: null,
              },
            ])
            .select()
            .single();

          if (error) {
            console.error("Error creating user:", error);
            return done(error, null);
          }
          user = newUser;
        }

        console.log("User authenticated:", user.email);
        return done(null, user);
      } catch (err) {
        console.error("Google auth error:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use(passport.initialize());
app.use(passport.session());

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

app.get("/auth/google", (req, res, next) => {
  console.log("Initiating Google OAuth...");
  passport.authenticate("google", {
    scope: ["profile", "email"],
    accessType: "offline",
    prompt: "consent",
  })(req, res, next);
});

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    try {
      console.log("Google callback successful, generating token...");
      const token = jwt.sign(
        { id: req.user.id, email: req.user.email },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
      res.redirect(`${process.env.FRONTEND_ORIGIN}/auth/google/callback?token=${token}`);
    } catch (error) {
      console.error("Callback error:", error);
      res.redirect(`${process.env.FRONTEND_ORIGIN}/auth/error`);
    }
  }
);

app.post("/signup", validate(signupSchema), async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          name,
          email,
          password: hashedPassword,
        },
      ])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    const token = jwt.sign({ id: data.id, email: data.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: data.id, name: data.name, email: data.email }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(401).json({
        error: "Please login with Google",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ 
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/posts", authenticateToken, async (req, res) => {
  try {
    console.log("GET /posts - User ID:", req.user.id);
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", req.user.id)
      .order("id", { ascending: false });

    if (error) {
      console.error("Get posts error:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("GET /posts - Found posts:", posts?.length || 0);
    res.json({ posts });
  } catch (err) {
    console.error("Get posts error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post(
  "/posts",
  authenticateToken,
  validate(postSchema),
  async (req, res) => {
    const { title, content } = req.body;
    try {
      console.log("POST /posts - User ID:", req.user.id, "Title:", title);
      const { data: post, error } = await supabase
        .from("posts")
        .insert([
          {
            title,
            content,
            user_id: req.user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Create post error:", error);
        return res.status(400).json({ error: error.message });
      }

      console.log("POST /posts - Created post:", post);
      res.status(201).json({ post });
    } catch (err) {
      console.error("Create post error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

app.put(
  "/posts/:id",
  authenticateToken,
  validate(postSchema),
  async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    try {
      const { data: existingPost } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .eq("user_id", req.user.id)
        .single();

      if (!existingPost) {
        return res
          .status(404)
          .json({ error: "Post not found or unauthorized" });
      }

      const { data: post, error } = await supabase
        .from("posts")
        .update({ title, content })
        .eq("id", id)
        .eq("user_id", req.user.id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ post });
    } catch (err) {
      console.error("Update post error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

app.delete("/posts/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/profile`);
});