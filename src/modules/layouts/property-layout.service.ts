import PropertyLayout from './property-layout.model';
import Space from './space.model';
import Element from './element.model';
import { LAYOUT_SECTION_CONFIG } from '../../constants/layout.constants';
import { IProperty } from '../../interfaces/property.interface';
import { buildLayoutImageUrl } from '../../utils/file-storage';

class PropertyLayoutService {
    async autoCreateLayout(property: IProperty): Promise<void> {
        const layout = await PropertyLayout.create({
            propertyId: property._id,
            ownerId: property.ownerId
        });

        const spaces: any[] = [];
        let order = 1;

        for (const config of LAYOUT_SECTION_CONFIG) {
            const count = (property as any)[config.field];

            if (count && typeof count === 'number' && count > 0) {
                for (let i = 1; i <= count; i++) {
                    spaces.push({
                        propertyId: property._id,
                        layoutId: layout._id,
                        ownerId: property.ownerId,
                        name: `${config.singular} ${i}`,
                        sourceField: config.field,
                        order: order++
                    });
                }
            }
        }

        if (spaces.length > 0) {
            await Space.insertMany(spaces);
        }
    }

    async getLayoutByProperty(propertyId: string, ownerId: string): Promise<any> {
        const layout = await PropertyLayout.findOne({ propertyId, ownerId });
        if (!layout) throw new Error('Layout not found');

        const spaces = await Space.find({ propertyId, ownerId })
            .sort({ order: 1 });

        const elements = await Element.find({ propertyId, ownerId })
            .sort({ order: 1 });

        const spaceMap = new Map<string, any>();

        const formattedSpaces = spaces.map((space: any) => {
            const row = {
                ...space.toJSON(),
                elements: []
            };
            spaceMap.set(space._id.toString(), row);
            return row;
        });

        elements.forEach((element: any) => {
            const space = spaceMap.get(element.spaceId.toString());
            if (!space) return;

            space.elements.push({
                ...element.toJSON(),
                photos: (element.referencePhotos || []).map((photo: any) => ({
                    ...photo.toJSON(),
                    url: buildLayoutImageUrl(photo.filename)
                }))
            });
        });

        return {
            ...layout.toJSON(),
            spaces: formattedSpaces
        };
    }
}

export default new PropertyLayoutService();