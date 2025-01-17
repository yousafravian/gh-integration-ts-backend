import type { AGGridFilterModel, FilterModel } from '@/common/types/ag-grid-filter.model';

/**
 * Translates AG Grid FilterModel to Mongoose Query Object
 * @param filterModel AG Grid Filter Model
 * @returns Mongoose Query Object
 */
export const translateFilterModelToMongooseQuery = (filterModel: AGGridFilterModel): Record<string, any> => {
  const mongooseQuery: Record<string, any> = {};

  for (const [colId, filter] of Object.entries(filterModel)) {
    switch (filter.filterType) {
      case 'text':
        mongooseQuery[colId] = translateTextFilter(filter);
        break;
      case 'number':
        mongooseQuery[colId] = translateNumberFilter(filter);
        break;
      case 'date':
        mongooseQuery[colId] = translateDateFilter(filter);
        break;
      case 'boolean':
        mongooseQuery[colId] = filter.filter;
        break;
      case 'multi':
        mongooseQuery[colId] = translateMultiFilter(filter);
        break;
      // Add more cases for custom filters if necessary
      default:
        console.warn(`Unsupported filter type: ${filter.filterType}`);
    }
  }

  return mongooseQuery;
};

/**
 * Translates TextFilterModel to Mongoose Query
 * @param filter TextFilterModel
 * @returns Mongoose Query Object for text filters
 */
const translateTextFilter = (filter: FilterModel): any => {
  const textFilter = filter as any; // Type assertion for specific filter type
  switch (filter.type) {
    case 'contains':
      return { $regex: textFilter.filter, $options: 'i' }; // Case-insensitive
    case 'notContains':
      return { $not: { $regex: textFilter.filter, $options: 'i' } };
    case 'startsWith':
      return { $regex: `^${textFilter.filter}`, $options: 'i' };
    case 'endsWith':
      return { $regex: `${textFilter.filter}$`, $options: 'i' };
    case 'equals':
      return textFilter.filter;
    case 'notEqual':
      return { $ne: textFilter.filter };
    default:
      return {};
  }
};

/**
 * Translates NumberFilterModel to Mongoose Query
 * @param filter NumberFilterModel
 * @returns Mongoose Query Object for number filters
 */
const translateNumberFilter = (filter: FilterModel): any => {
  const numberFilter = filter as any; // Type assertion for specific filter type
  switch (filter.type) {
    case 'equals':
      return numberFilter.filter;
    case 'notEqual':
      return { $ne: numberFilter.filter };
    case 'lessThan':
      return { $lt: numberFilter.filter };
    case 'greaterThan':
      return { $gt: numberFilter.filter };
    case 'lessThanOrEqual':
      return { $lte: numberFilter.filter };
    case 'greaterThanOrEqual':
      return { $gte: numberFilter.filter };
    case 'inRange':
      return { $gte: numberFilter.filter, $lte: numberFilter.filterTo };
    default:
      return {};
  }
};

/**
 * Translates DateFilterModel to Mongoose Query
 * @param filter DateFilterModel
 * @returns Mongoose Query Object for date filters
 */
const translateDateFilter = (filter: FilterModel): any => {
  const dateFilter = filter as any; // Type assertion for specific filter type
  switch (filter.type) {
    case 'equals':
      return new Date(dateFilter.dateFrom);
    case 'notEqual':
      return { $ne: new Date(dateFilter.dateFrom) };
    case 'lessThan':
      return { $lt: new Date(dateFilter.dateFrom) };
    case 'greaterThan':
      return { $gt: new Date(dateFilter.dateFrom) };
    case 'inRange':
      return {
        $gte: new Date(dateFilter.dateFrom),
        $lte: new Date(dateFilter.dateTo),
      };
    default:
      return {};
  }
};

/**
 * Translates MultiFilterModel to Mongoose Query
 * @param filter MultiFilterModel
 * @returns Mongoose Query Object for multi filters
 */
const translateMultiFilter = (filter: FilterModel): any => {
  const multiFilter = filter as any; // Type assertion for specific filter type
  const conditions = [];

  if (multiFilter.condition1) {
    conditions.push(translateFilterModelToMongooseQuery({ condition1: multiFilter.condition1 }));
  }

  if (multiFilter.condition2) {
    conditions.push(translateFilterModelToMongooseQuery({ condition2: multiFilter.condition2 }));
  }

  // Merge all conditions
  if (multiFilter.operator === 'AND') {
    return { $and: conditions };
  } else if (multiFilter.operator === 'OR') {
    return { $or: conditions };
  }

  return {};
};
