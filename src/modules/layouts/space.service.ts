import Space from './space.model';

class SpaceService {
    async createSpace(propertyId: string, layoutId: string, ownerId: string, name: string): Promise<any> {
        const lastSpace = await Space.findOne({ propertyId, ownerId }).sort({ order: -1 });
        const order = lastSpace ? lastSpace.order + 1 : 1;

        const space = await Space.create({
            propertyId,
            layoutId,
            ownerId,
            name,
            sourceField: 'custom',
            order
        });

        return space;
    }

    async getSpacesByProperty(propertyId: string, ownerId: string): Promise<any[]> {
        const spaces = await Space.find({ propertyId, ownerId }).sort({ order: 1 });
        return spaces;
    }

    async getSpaceById(spaceId: string, ownerId: string): Promise<any> {
        const space = await Space.findOne({ _id: spaceId, ownerId });
        if (!space) throw new Error('Space not found');
        return space;
    }

    async updateSpace(spaceId: string, ownerId: string, payload: { name?: string; order?: number }): Promise<any> {
        const space = await Space.findOneAndUpdate(
            { _id: spaceId, ownerId },
            { $set: payload },
            { new: true }
        );
        if (!space) throw new Error('Space not found');
        return space;
    }

    async deleteSpace(spaceId: string, ownerId: string): Promise<void> {
        const space = await Space.findOneAndDelete({ _id: spaceId, ownerId });
        if (!space) throw new Error('Space not found');
    }
}

export default new SpaceService();
