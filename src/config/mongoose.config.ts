import mongoose from 'mongoose';

/**
 * Global Mongoose plugin: _id → id, remove __v on all schemas.
 * Must be loaded BEFORE any model import (schema creation).
 */
mongoose.plugin((schema) => {
    const transform = (_doc: any, ret: any) => {
        if (ret._id) {
            ret.id = ret._id.toString();
            delete ret._id;
        }
        delete ret.__v;
        return ret;
    };

    schema.set('toJSON', { virtuals: true, transform });
    schema.set('toObject', { virtuals: true, transform });
});
