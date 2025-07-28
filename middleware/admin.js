import express from 'express';
import jwt from 'jsonwebtoken';


const adminProtectMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.token;
    //console.log(token)
    

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
   

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    // Attach admin info to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.log(error)
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default adminProtectMiddleware