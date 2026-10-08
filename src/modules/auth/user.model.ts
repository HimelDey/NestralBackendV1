import mongoose, { Schema } from 'mongoose';
import { IUser  } from '../../interfaces/user.interface';

const UserSchema = new Schema<IUser>({
    email: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    phoneNumber: { type: String, required: true, unique: true, trim: true },
    firstName: String,
    lastName: String, 
    profileImageUrl: { type: String, default: null },
    token: { type: String },
    refreshToken: { type: String },
    approved: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
