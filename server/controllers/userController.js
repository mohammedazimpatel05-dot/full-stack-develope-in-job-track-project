import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; // optional for login token
import User from "../models/User.js";
import nodemailer from "nodemailer";

// -------------------- REGISTER --------------------
export const registerUser = async (req, res) => {
  try {
    const { name, email, contact, password } = req.body;

    // check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists ❌" });
    }

    // create new user
    const newUser = new User({ name, email, contact, password });
    await newUser.save(); // password will be hashed automatically

    // Send Welcome Email (Non-blocking background call)
    sendEmail(newUser).catch((err) => console.error("Email Error:", err.message));

    res.status(201).json({ message: "User registered successfully ✅" });
  } catch (error) {
    res.status(500).json({ message: "Registration failed ❌", error: error.message });
  }
};

const sendEmail = async (newUser) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: newUser.email,
      subject: "Welcome to Our Service!",
      html: `<p>Hello ${newUser.name},</p>
             <p>Welcome to our service! We're thrilled to have you onboard.</p>
             <p>If you have any questions or need help getting started, feel free to reach out to our support team.</p>
             <p>Best regards,<br>JobTrack Team</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
  } catch (error) {
    console.error("Error sending email:", error.message);
  }
};

// -------------------- LOGIN --------------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials ❌" });

    // check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: "Invalid credentials ❌" });

    // create token for session
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secretKey123", { expiresIn: "1h" });

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
    res.status(500).json({ message: "Login failed ❌", error: error.message });
  }
};
