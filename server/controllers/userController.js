
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import nodemailer from "nodemailer";

// -------------------- REGISTER --------------------
export const registerUser = async (req, res) => {
  try {
    const { name, email, contact, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists ❌",
      });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      contact,
      password,
    });

    await newUser.save();

    // Send welcome email
    try {
      await sendEmail(newUser);
    } catch (emailError) {
      console.error("Welcome email failed:", emailError.message);
      // Registration still succeeds even if email fails
    }

    res.status(201).json({
      message: "User registered successfully ✅",
    });

  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      message: "Registration failed ❌",
      error: error.message,
    });
  }
};

// -------------------- SEND EMAIL --------------------
const sendEmail = async (newUser) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: newUser.email,
    subject: "Welcome to Our Service! 🎉",

    html: `
      <p>Hello ${newUser.name},</p>

      <p>
        Welcome to our service! We're thrilled to have you onboard.
      </p>

      <p>
        If you have any questions or need help getting started,
        feel free to reach out to our support team.
      </p>

      <p>
        Best regards,<br>
        Your Company Name
      </p>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log("Email sent:", info.response);
};

// -------------------- LOGIN --------------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials ❌",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid credentials ❌",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secretKey123",
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful ✅",

      token,

      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed ❌",
      error: error.message,
    });
  }
};


