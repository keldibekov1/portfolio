import { EmailTemplate } from "@/components/email-template";
import { config } from "@/data/config";
import { Resend } from "resend";
import { z } from "zod";
import { createElement } from "react"; // BU MUHIM!!!

const resend = new Resend(process.env.RESEND_API_KEY);

// Zod schema
const Email = z.object({
  fullName: z.string().min(2, "Full name is invalid!"),
  email: z.string().email({ message: "Email is invalid!" }),
  message: z.string().min(10, "Message is too short!"),
});

// POST method
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Body:", body);

    // Validate input
    const {
      success: zodSuccess,
      data: zodData,
      error: zodError,
    } = Email.safeParse(body);

    if (!zodSuccess) {
      return Response.json(
        {
          error: zodError?.errors?.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    // Send email
    const { data: resendData, error: resendError } = await resend.emails.send({
      from: "Portfolio <onboarding@resend.dev>",
      to: [config.email],
      subject: "Contact me from portfolio",
      react: createElement(EmailTemplate, {
        fullName: zodData.fullName,
        email: zodData.email,
        message: zodData.message,
      }),
    });

    // Check resend error
    if (resendError) {
      console.error("Resend Error:", resendError);
      return Response.json({ resendError }, { status: 500 });
    }

    // Return success
    return Response.json(resendData);
  } catch (error) {
    console.error("Server Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
