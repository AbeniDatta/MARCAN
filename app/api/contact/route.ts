import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
    try {
        const { name, email, subject, message } = await req.json();

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Name, email, and message are required.' },
                { status: 400 }
            );
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Marcan Contact" <${process.env.SMTP_USER}>`,
            to: 'marcan.initiative@gmail.com',
            replyTo: email,
            subject: subject || 'New contact form submission',
            text: [
                `Name: ${name}`,
                `Email: ${email}`,
                '',
                message,
            ].join('\n'),
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error sending contact email:', error);
        return NextResponse.json(
            {
                error: 'Failed to send message. Please try again later.',
                details: error.message || 'Unknown error',
            },
            { status: 500 }
        );
    }
}

