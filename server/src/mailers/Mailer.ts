export type SendMailParams = {
	to: string;
	subject: string;
	html: string;
};

export interface Mailer {
	send(params: SendMailParams): Promise<void>;
}
