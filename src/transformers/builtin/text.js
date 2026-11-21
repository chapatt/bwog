import * as z from 'zod';

export const schema = z.object({
    text: z.string().max(500),
}).transform(data => ({type: 'text', ...data}));

export function handler(data) {
    return data;
}
