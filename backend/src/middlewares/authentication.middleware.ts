import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
    id: string;
    email: string;
}

export async function authenticate_user(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const bearer = req.headers.authorization;
    const token =
        req.cookies?.token ??
        (bearer?.startsWith("Bearer ") ? bearer.slice(7) : undefined);

    // No token
    if (!token) {
        return res.status(401).json({
            message: "Not authenticated. Please sign in again.",
        });
    }

    try {
        // Verify JWT

        console.log("verifying jwt ")
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as JwtPayload;

        // Put authenticated user into req
        req.user = decoded ;

        next();

    } catch (err) {
        console.log("Authentication error:", err);

        return res.status(401).json({
            message: "Session expired or invalid. Please sign in again.",
        });
    }
}
