import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import  prisma  from "../config/db.js";
import jwt from "jsonwebtoken";

const router = Router();

const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    path: "/",
};

router.post("/signup", async (req: Request, res: Response) => {
    console.log("reached end point")
    const data = req.body;

    if (!data.email || !data.password) {
        return res.status(400).json({
            message: "Send all the required fields to signup!",
        });
    }

    const username = data.username ?? data.email.split("@")[0];
    const name = data.name ?? username;

    try {
        const hashed_password = await bcrypt.hash(data.password, 10);

        const user_data = await prisma.user.create({
            data: {
                name,
                username,
                email: data.email,
                password: hashed_password,
            },
        });

        console.log(user_data);

        const token = jwt.sign(
            {
                id: user_data.id,
                name: user_data.name,
            },
            process.env.JWT_SECRET!
        );

        return res
            .status(200)
            .cookie("token", token, cookieOptions)
            .json({
                message: "Signup successful!",
                token,
            });
    } catch (err) {
        console.log(err);

        const isDuplicate = (err as { code?: string }).code === "P2002";

        return res.status(400).json({
            message: isDuplicate
                ? "An account with that email already exists."
                : "Signup not successful!",
        });
    }
});

router.post("/signin", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Please provide all the credentials",
        });
    }

    const user = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });

    if (!user) {
        return res.status(401).json({
            message:
                "No user found with these credentials. Please signup with your email or try another email.",
        });
    }

    const isVerified = await bcrypt.compare(password, user.password);

    if (!isVerified) {
        return res.status(401).json({
            message: "Wrong password",
        });
    }

    const token = jwt.sign(
        {
            id: user.id,
            name: user.name,
        },
        process.env.JWT_SECRET!
    );

    return res
        .status(200)
        .cookie("token", token, cookieOptions)
        .json({
            message: "Login successful!",
            token,
        });
});

export default router;
