import * as z from 'zod';

const imageSchema = z.object({
    text: z.string()
        .max(500),
    image: z.file()
        .max(5000000)
        .mime(['image/png', 'image/jpg']),
}).transform(({image, ...rest}) => ({
    type: 'image',
    attachments: {
        image,
    },
    ...rest,
}));

const textSchema = z.object({
    text: z.string().max(500),
}).transform(data => ({type: 'text', ...data}));

export const schema = z.union([imageSchema, textSchema]);
