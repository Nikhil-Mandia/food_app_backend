const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const createOrder = z
  .object({
    customer: z.object({
      name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
      address: z.string().trim().min(10, 'Address must be at least 10 characters').max(200),
      phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Phone must be a valid 10-digit mobile number'),
    }),
    items: z
      .array(
        z.object({
          menuItemId: objectId,
          quantity: z.number().int().min(1, 'Minimum quantity is 1').max(10, 'Maximum quantity is 10'),
        })
      )
      .min(1, 'Cart cannot be empty')
      .max(20),
  })
  .refine((d) => new Set(d.items.map((i) => i.menuItemId)).size === d.items.length, {
    message: 'Duplicate items are not allowed',
    path: ['items'],
  });

const updateStatus = z.object({
  status: z.enum(['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED']),
});

const idParam = z.object({ id: objectId });

const listQuery = z.object({
  ids: z
    .string()
    .transform((s) => s.split(',').filter(Boolean))
    .pipe(z.array(objectId).min(1).max(50)),
});

module.exports = { createOrder, updateStatus, idParam, listQuery };
