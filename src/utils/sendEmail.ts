import nodemailer, { Transporter } from "nodemailer";

/* ----------------------------------
   Email Payload Interface
-----------------------------------*/
interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}
/* ----------------------------------
   Create Transporter
-----------------------------------*/
const transporter: Transporter = nodemailer.createTransport({
  service: "gmail", // or SMTP host config
  auth: {
    user: process.env.EMAIL_USER as string,
    pass: process.env.EMAIL_PASS as string,
  },
});

/* ----------------------------------
   Send Email Function
-----------------------------------*/
export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: SendEmailOptions): Promise<void> => {
  await transporter.sendMail({
    from: `"Code Marketplace" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};
