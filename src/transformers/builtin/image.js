import * as z from 'zod';

export const schema = z.object({
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
