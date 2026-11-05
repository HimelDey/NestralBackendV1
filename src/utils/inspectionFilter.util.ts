type Query = Record<string, any>;

const TYPE_VALUES = ['entry', 'exit', 'routine'];
const STATUS_VALUES = ['scheduled', 'completed', 'cancelled'];

export function extractFilters(query: any): string[] {
  const tokens: string[] = [];

  if (query.filter) {
    tokens.push(...String(query.filter).split(','));
  }

  if (query.status) {
    const status = Array.isArray(query.status)
      ? query.status
      : [query.status];
    tokens.push(...status);
  }

  if (query.inspectionType) {
    const type = Array.isArray(query.inspectionType)
      ? query.inspectionType
      : [query.inspectionType];
    tokens.push(...type);
  }

  return tokens;
}

export function buildQuery(tokens: string[]) {
  const now = new Date();

  const andConditions: any[] = [];
  const orConditions: any[] = [];

  tokens.forEach(token => {

    // ✅ TYPE FILTER (DB FIELD)
    if (TYPE_VALUES.includes(token)) {
      andConditions.push({ inspectionType: token });
    }

    // ✅ STORED STATUS
    else if (STATUS_VALUES.includes(token)) {
      andConditions.push({ status: token });
    }

    // ✅ COMPUTED STATUS
    else if (token === 'overdue') {
      orConditions.push({
        status: 'scheduled',
        date: { $lt: now }
      });
    }
  });

  const query: any = {};

  if (andConditions.length) {
    query.$and = andConditions;
  }

  if (orConditions.length) {
    query.$or = orConditions;
  }

  return query;
}