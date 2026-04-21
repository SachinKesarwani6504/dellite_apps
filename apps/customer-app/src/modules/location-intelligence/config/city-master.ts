import type { CityCode } from '@/modules/location-intelligence/types/location-resolution';
import { normalizeToken } from '@/modules/location-intelligence/utils/text-normalizer';

type CityMasterItem = {
  code: CityCode;
  displayName: string;
  aliases: string[];
  bookingEnabled: boolean;
  launchedLocalityAliases: string[];
};

export const CITY_MASTER: CityMasterItem[] = [
  {
    code: 'PRAYAGRAJ',
    displayName: 'Prayagraj',
    aliases: ['PRAYAGRAJ', 'ALLAHABAD', 'PRAYAG RAJ'],
    bookingEnabled: true,
    launchedLocalityAliases: [
      'NAINI',
      'BAIRAHANA',
      'BAIRAHNA',
      'BALUAGHAT',
      'BALUGAHT',
      'CIVIL LINES',
      'CIVIL LINE',
      'CIVILINE',
    ],
  },
  {
    code: 'CHITRAKOOT',
    displayName: 'Chitrakoot',
    aliases: ['CHITRAKOOT', 'CHITRAKOOT', 'CHITRAKOOT DIVISION', 'CHITRAKOOT DIVISION'],
    bookingEnabled: false,
    launchedLocalityAliases: [],
  },
  {
    code: 'LUCKNOW',
    displayName: 'Lucknow',
    aliases: ['LUCKNOW', 'LKO'],
    bookingEnabled: false,
    launchedLocalityAliases: [],
  },
  {
    code: 'KANPUR',
    displayName: 'Kanpur',
    aliases: ['KANPUR', 'KANPUR NAGAR'],
    bookingEnabled: false,
    launchedLocalityAliases: [],
  },
];

export const CITY_BY_ALIAS = new Map<string, CityMasterItem>();
export const CITY_BY_CODE = new Map<CityCode, CityMasterItem>();

for (let index = 0; index < CITY_MASTER.length; index += 1) {
  const city = CITY_MASTER[index];
  CITY_BY_CODE.set(city.code, city);
  for (let aliasIndex = 0; aliasIndex < city.aliases.length; aliasIndex += 1) {
    CITY_BY_ALIAS.set(normalizeToken(city.aliases[aliasIndex]), city);
  }
}
