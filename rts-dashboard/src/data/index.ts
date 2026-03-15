import rawDataJson from './rawData.json';
import { RawData } from '../types';

const D = rawDataJson as unknown as RawData;
export default D;

export const YM = D.filters.ym_list;
export const WM = D.week_mondays;
