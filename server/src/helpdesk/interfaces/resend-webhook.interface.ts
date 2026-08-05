export interface ResendWebhookPayload {
  type: 'email.received';
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    html: string;
    text: string;
    headers: {
      'message-id'?: string;
      date?: string;
      [key: string]: string | undefined;
    };
    attachments: any[];
  };
}
