import React, { useEffect, useState } from 'react';

export const COUNTRY_CODES = [
  { code: '+93', name: 'Afghanistan' }, { code: '+355', name: 'Albania' }, { code: '+213', name: 'Algeria' },
  { code: '+1-684', name: 'American Samoa' }, { code: '+376', name: 'Andorra' }, { code: '+244', name: 'Angola' },
  { code: '+1-264', name: 'Anguilla' }, { code: '+672', name: 'Antarctica' }, { code: '+1-268', name: 'Antigua and Barbuda' },
  { code: '+54', name: 'Argentina' }, { code: '+374', name: 'Armenia' }, { code: '+297', name: 'Aruba' },
  { code: '+61', name: 'Australia' }, { code: '+43', name: 'Austria' }, { code: '+994', name: 'Azerbaijan' },
  { code: '+1-242', name: 'Bahamas' }, { code: '+973', name: 'Bahrain' }, { code: '+880', name: 'Bangladesh' },
  { code: '+1-246', name: 'Barbados' }, { code: '+375', name: 'Belarus' }, { code: '+32', name: 'Belgium' },
  { code: '+501', name: 'Belize' }, { code: '+229', name: 'Benin' }, { code: '+1-441', name: 'Bermuda' },
  { code: '+975', name: 'Bhutan' }, { code: '+591', name: 'Bolivia' }, { code: '+387', name: 'Bosnia and Herzegovina' },
  { code: '+267', name: 'Botswana' }, { code: '+55', name: 'Brazil' }, { code: '+246', name: 'British Indian Ocean Territory' },
  { code: '+1-284', name: 'British Virgin Islands' }, { code: '+673', name: 'Brunei' }, { code: '+359', name: 'Bulgaria' },
  { code: '+226', name: 'Burkina Faso' }, { code: '+257', name: 'Burundi' }, { code: '+855', name: 'Cambodia' },
  { code: '+237', name: 'Cameroon' }, { code: '+1', name: 'Canada' }, { code: '+238', name: 'Cape Verde' },
  { code: '+1-345', name: 'Cayman Islands' }, { code: '+236', name: 'Central African Republic' }, { code: '+235', name: 'Chad' },
  { code: '+56', name: 'Chile' }, { code: '+86', name: 'China' }, { code: '+61', name: 'Christmas Island' },
  { code: '+61', name: 'Cocos Islands' }, { code: '+57', name: 'Colombia' }, { code: '+269', name: 'Comoros' },
  { code: '+242', name: 'Congo' }, { code: '+243', name: 'Congo, Democratic Republic' }, { code: '+682', name: 'Cook Islands' },
  { code: '+506', name: 'Costa Rica' }, { code: '+225', name: 'Cote d’Ivoire' }, { code: '+385', name: 'Croatia' },
  { code: '+53', name: 'Cuba' }, { code: '+599', name: 'Curacao' }, { code: '+357', name: 'Cyprus' }, { code: '+420', name: 'Czech Republic' },
  { code: '+45', name: 'Denmark' }, { code: '+253', name: 'Djibouti' }, { code: '+1-767', name: 'Dominica' },
  { code: '+1-809', name: 'Dominican Republic' }, { code: '+593', name: 'Ecuador' }, { code: '+20', name: 'Egypt' },
  { code: '+503', name: 'El Salvador' }, { code: '+240', name: 'Equatorial Guinea' }, { code: '+291', name: 'Eritrea' },
  { code: '+372', name: 'Estonia' }, { code: '+268', name: 'Eswatini' }, { code: '+251', name: 'Ethiopia' },
  { code: '+500', name: 'Falkland Islands' }, { code: '+298', name: 'Faroe Islands' }, { code: '+679', name: 'Fiji' },
  { code: '+358', name: 'Finland' }, { code: '+33', name: 'France' }, { code: '+594', name: 'French Guiana' },
  { code: '+689', name: 'French Polynesia' }, { code: '+241', name: 'Gabon' }, { code: '+220', name: 'Gambia' },
  { code: '+995', name: 'Georgia' }, { code: '+49', name: 'Germany' }, { code: '+233', name: 'Ghana' },
  { code: '+350', name: 'Gibraltar' }, { code: '+30', name: 'Greece' }, { code: '+299', name: 'Greenland' },
  { code: '+1-473', name: 'Grenada' }, { code: '+590', name: 'Guadeloupe' }, { code: '+1-671', name: 'Guam' },
  { code: '+502', name: 'Guatemala' }, { code: '+44-1481', name: 'Guernsey' }, { code: '+224', name: 'Guinea' },
  { code: '+245', name: 'Guinea-Bissau' }, { code: '+592', name: 'Guyana' }, { code: '+509', name: 'Haiti' },
  { code: '+504', name: 'Honduras' }, { code: '+852', name: 'Hong Kong' }, { code: '+36', name: 'Hungary' },
  { code: '+354', name: 'Iceland' }, { code: '+91', name: 'India' }, { code: '+62', name: 'Indonesia' },
  { code: '+98', name: 'Iran' }, { code: '+964', name: 'Iraq' }, { code: '+353', name: 'Ireland' },
  { code: '+44-1624', name: 'Isle of Man' }, { code: '+972', name: 'Israel' }, { code: '+39', name: 'Italy' },
  { code: '+1-876', name: 'Jamaica' }, { code: '+81', name: 'Japan' }, { code: '+44-1534', name: 'Jersey' },
  { code: '+962', name: 'Jordan' }, { code: '+7', name: 'Kazakhstan' }, { code: '+254', name: 'Kenya' },
  { code: '+686', name: 'Kiribati' }, { code: '+383', name: 'Kosovo' }, { code: '+965', name: 'Kuwait' },
  { code: '+996', name: 'Kyrgyzstan' }, { code: '+856', name: 'Laos' }, { code: '+371', name: 'Latvia' },
  { code: '+961', name: 'Lebanon' }, { code: '+266', name: 'Lesotho' }, { code: '+231', name: 'Liberia' },
  { code: '+218', name: 'Libya' }, { code: '+423', name: 'Liechtenstein' }, { code: '+370', name: 'Lithuania' },
  { code: '+352', name: 'Luxembourg' }, { code: '+853', name: 'Macao' }, { code: '+261', name: 'Madagascar' },
  { code: '+265', name: 'Malawi' }, { code: '+60', name: 'Malaysia' }, { code: '+960', name: 'Maldives' },
  { code: '+356', name: 'Malta' }, { code: '+692', name: 'Marshall Islands' }, { code: '+596', name: 'Martinique' },
  { code: '+222', name: 'Mauritania' }, { code: '+230', name: 'Mauritius' }, { code: '+262', name: 'Mayotte' },
  { code: '+52', name: 'Mexico' }, { code: '+691', name: 'Micronesia' }, { code: '+373', name: 'Moldova' },
  { code: '+377', name: 'Monaco' }, { code: '+976', name: 'Mongolia' }, { code: '+382', name: 'Montenegro' },
  { code: '+1-664', name: 'Montserrat' }, { code: '+212', name: 'Morocco' }, { code: '+258', name: 'Mozambique' },
  { code: '+95', name: 'Myanmar' }, { code: '+264', name: 'Namibia' }, { code: '+674', name: 'Nauru' },
  { code: '+977', name: 'Nepal' }, { code: '+31', name: 'Netherlands' }, { code: '+687', name: 'New Caledonia' },
  { code: '+64', name: 'New Zealand' }, { code: '+505', name: 'Nicaragua' }, { code: '+227', name: 'Niger' },
  { code: '+234', name: 'Nigeria' }, { code: '+683', name: 'Niue' }, { code: '+850', name: 'North Korea' },
  { code: '+389', name: 'North Macedonia' }, { code: '+1-670', name: 'Northern Mariana Islands' }, { code: '+47', name: 'Norway' },
  { code: '+968', name: 'Oman' }, { code: '+92', name: 'Pakistan' }, { code: '+680', name: 'Palau' },
  { code: '+970', name: 'Palestine' }, { code: '+507', name: 'Panama' }, { code: '+675', name: 'Papua New Guinea' },
  { code: '+595', name: 'Paraguay' }, { code: '+51', name: 'Peru' }, { code: '+63', name: 'Philippines' },
  { code: '+48', name: 'Poland' }, { code: '+351', name: 'Portugal' }, { code: '+1-787', name: 'Puerto Rico' },
  { code: '+974', name: 'Qatar' }, { code: '+262', name: 'Reunion' }, { code: '+40', name: 'Romania' },
  { code: '+7', name: 'Russia' }, { code: '+250', name: 'Rwanda' }, { code: '+590', name: 'Saint Barthelemy' },
  { code: '+290', name: 'Saint Helena' }, { code: '+1-869', name: 'Saint Kitts and Nevis' }, { code: '+1-758', name: 'Saint Lucia' },
  { code: '+590', name: 'Saint Martin' }, { code: '+508', name: 'Saint Pierre and Miquelon' }, { code: '+1-784', name: 'Saint Vincent and the Grenadines' },
  { code: '+685', name: 'Samoa' }, { code: '+378', name: 'San Marino' }, { code: '+239', name: 'Sao Tome and Principe' },
  { code: '+966', name: 'Saudi Arabia' }, { code: '+221', name: 'Senegal' }, { code: '+381', name: 'Serbia' },
  { code: '+248', name: 'Seychelles' }, { code: '+232', name: 'Sierra Leone' }, { code: '+65', name: 'Singapore' },
  { code: '+1-721', name: 'Sint Maarten' }, { code: '+421', name: 'Slovakia' }, { code: '+386', name: 'Slovenia' },
  { code: '+677', name: 'Solomon Islands' }, { code: '+252', name: 'Somalia' }, { code: '+27', name: 'South Africa' },
  { code: '+82', name: 'South Korea' }, { code: '+211', name: 'South Sudan' }, { code: '+34', name: 'Spain' },
  { code: '+94', name: 'Sri Lanka' }, { code: '+249', name: 'Sudan' }, { code: '+597', name: 'Suriname' },
  { code: '+47', name: 'Svalbard and Jan Mayen' }, { code: '+46', name: 'Sweden' }, { code: '+41', name: 'Switzerland' },
  { code: '+963', name: 'Syria' }, { code: '+886', name: 'Taiwan' }, { code: '+992', name: 'Tajikistan' },
  { code: '+255', name: 'Tanzania' }, { code: '+66', name: 'Thailand' }, { code: '+670', name: 'Timor-Leste' },
  { code: '+228', name: 'Togo' }, { code: '+690', name: 'Tokelau' }, { code: '+676', name: 'Tonga' },
  { code: '+1-868', name: 'Trinidad and Tobago' }, { code: '+216', name: 'Tunisia' }, { code: '+90', name: 'Turkey' },
  { code: '+993', name: 'Turkmenistan' }, { code: '+1-649', name: 'Turks and Caicos Islands' }, { code: '+688', name: 'Tuvalu' },
  { code: '+256', name: 'Uganda' }, { code: '+380', name: 'Ukraine' }, { code: '+971', name: 'United Arab Emirates' },
  { code: '+44', name: 'United Kingdom' }, { code: '+1', name: 'United States' }, { code: '+598', name: 'Uruguay' },
  { code: '+998', name: 'Uzbekistan' }, { code: '+678', name: 'Vanuatu' }, { code: '+39', name: 'Vatican City' },
  { code: '+58', name: 'Venezuela' }, { code: '+84', name: 'Vietnam' }, { code: '+1-284', name: 'Virgin Islands, British' },
  { code: '+1-340', name: 'Virgin Islands, U.S.' }, { code: '+681', name: 'Wallis and Futuna' }, { code: '+212', name: 'Western Sahara' },
  { code: '+967', name: 'Yemen' }, { code: '+260', name: 'Zambia' }, { code: '+263', name: 'Zimbabwe' },
];

const getInitialCountry = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '+63';
  return COUNTRY_CODES.find(({ code }) => digits.startsWith(code.replace(/\D/g, '')))?.code || '+63';
};

const getLocalNumber = (value, countryCode) => {
  const digits = String(value || '').replace(/\D/g, '');
  const countryDigits = countryCode.replace(/\D/g, '');
  if (digits.startsWith(countryDigits)) return digits.slice(countryDigits.length);
  if (countryCode === '+63' && digits.startsWith('0')) return digits.slice(1);
  return digits;
};

const COUNTRY_FLAGS = {
  Afghanistan: '🇦🇫', Albania: '🇦🇱', Algeria: '🇩🇿', Argentina: '🇦🇷', Australia: '🇦🇺', Austria: '🇦🇹',
  Bahrain: '🇧🇭', Bangladesh: '🇧🇩', Belgium: '🇧🇪', Brazil: '🇧🇷', Bulgaria: '🇧🇬', Cambodia: '🇰🇭',
  Canada: '🇨🇦', Chile: '🇨🇱', China: '🇨🇳', Colombia: '🇨🇴', Croatia: '🇭🇷', Cyprus: '🇨🇾',
  Denmark: '🇩🇰', Ecuador: '🇪🇨', Egypt: '🇪🇬', Estonia: '🇪🇪', Fiji: '🇫🇯', Finland: '🇫🇮', France: '🇫🇷',
  Georgia: '🇬🇪', Germany: '🇩🇪', Ghana: '🇬🇭', Greece: '🇬🇷', Guatemala: '🇬🇹', Hong: '🇭🇰', Hungary: '🇭🇺',
  Iceland: '🇮🇸', India: '🇮🇳', Indonesia: '🇮🇩', Iran: '🇮🇷', Iraq: '🇮🇶', Ireland: '🇮🇪', Israel: '🇮🇱',
  Italy: '🇮🇹', Jamaica: '🇯🇲', Japan: '🇯🇵', Jordan: '🇯🇴', Kenya: '🇰🇪', Kuwait: '🇰🇼', Laos: '🇱🇦',
  Latvia: '🇱🇻', Lebanon: '🇱🇧', Lesotho: '🇱🇸', Lithuania: '🇱🇹', Luxembourg: '🇱🇺', Malaysia: '🇲🇾', Maldives: '🇲🇻',
  Malta: '🇲🇹', Mexico: '🇲🇽', Monaco: '🇲🇨', Mongolia: '🇲🇳', Morocco: '🇲🇦', Myanmar: '🇲🇲', Nepal: '🇳🇵',
  Netherlands: '🇳🇱', 'New Zealand': '🇳🇿', Nigeria: '🇳🇬', Norway: '🇳🇴', Oman: '🇴🇲', Pakistan: '🇵🇰',
  Panama: '🇵🇦', Paraguay: '🇵🇾', Peru: '🇵🇪', Philippines: '🇵🇭', Poland: '🇵🇱', Portugal: '🇵🇹', Qatar: '🇶🇦',
  Romania: '🇷🇴', Russia: '🇷🇺', Rwanda: '🇷🇼', 'Saudi Arabia': '🇸🇦', Senegal: '🇸🇳', Serbia: '🇷🇸', Singapore: '🇸🇬',
  Slovakia: '🇸🇰', Slovenia: '🇸🇮', Somalia: '🇸🇴', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷', Spain: '🇪🇸',
  'Sri Lanka': '🇱🇰', Sudan: '🇸🇩', Sweden: '🇸🇪', Switzerland: '🇨🇭', Syria: '🇸🇾', Taiwan: '🇹🇼', Tanzania: '🇹🇿',
  Thailand: '🇹🇭', Tunisia: '🇹🇳', Turkey: '🇹🇷', Ukraine: '🇺🇦', 'United Arab Emirates': '🇦🇪',
  'United Kingdom': '🇬🇧', 'United States': '🇺🇸', Uruguay: '🇺🇾', Uzbekistan: '🇺🇿', Venezuela: '🇻🇪',
  Vietnam: '🇻🇳', Yemen: '🇾🇪', Zambia: '🇿🇲', Zimbabwe: '🇿🇼',
  'American Samoa': '🇦🇸', Andorra: '🇦🇩', Angola: '🇦🇴', Anguilla: '🇦🇮', Antarctica: '🇦🇶',
  'Antigua and Barbuda': '🇦🇬', Armenia: '🇦🇲', Aruba: '🇦🇼', Azerbaijan: '🇦🇿', Bahamas: '🇧🇸', Barbados: '🇧🇧',
  Belarus: '🇧🇾', Belize: '🇧🇿', Benin: '🇧🇯', Bermuda: '🇧🇲', Bhutan: '🇧🇹', Bolivia: '🇧🇴',
  'Bosnia and Herzegovina': '🇧🇦', Botswana: '🇧🇼', 'British Indian Ocean Territory': '🇮🇴',
  'British Virgin Islands': '🇻🇬', Brunei: '🇧🇳', 'Burkina Faso': '🇧🇫', Burundi: '🇧🇮', Cameroon: '🇨🇲',
  'Cape Verde': '🇨🇻', 'Cayman Islands': '🇰🇾', 'Central African Republic': '🇨🇫', Chad: '🇹🇩',
  'Christmas Island': '🇨🇽', 'Cocos Islands': '🇨🇨', Comoros: '🇰🇲', Congo: '🇨🇬',
  'Congo, Democratic Republic': '🇨🇩', 'Cook Islands': '🇨🇰', 'Costa Rica': '🇨🇷', 'Cote d’Ivoire': '🇨🇮',
  Cuba: '🇨🇺', Curacao: '🇨🇼', 'Czech Republic': '🇨🇿', Djibouti: '🇩🇯', Dominica: '🇩🇲',
  'Dominican Republic': '🇩🇴', 'El Salvador': '🇸🇻', 'Equatorial Guinea': '🇬🇶', Eritrea: '🇪🇷', Eswatini: '🇸🇿',
  Ethiopia: '🇪🇹', 'Falkland Islands': '🇫🇰', 'Faroe Islands': '🇫🇴', 'French Guiana': '🇬🇫',
  'French Polynesia': '🇵🇫', Gabon: '🇬🇦', Gambia: '🇬🇲', Gibraltar: '🇬🇮', Greenland: '🇬🇱',
  Grenada: '🇬🇩', Guadeloupe: '🇬🇵', Guam: '🇬🇺', Guernsey: '🇬🇬', Guinea: '🇬🇳', 'Guinea-Bissau': '🇬🇼',
  Guyana: '🇬🇾', Haiti: '🇭🇹', Honduras: '🇭🇳', 'Hong Kong': '🇭🇰', 'Isle of Man': '🇮🇲', Jersey: '🇯🇪', Kazakhstan: '🇰🇿',
  Kiribati: '🇰🇮', Kosovo: '🇽🇰', Kyrgyzstan: '🇰🇬', Liberia: '🇱🇷', Libya: '🇱🇾', Liechtenstein: '🇱🇮',
  Macao: '🇲🇴', Madagascar: '🇲🇬', Malawi: '🇲🇼', 'Marshall Islands': '🇲🇭', Martinique: '🇲🇶',
  Mauritania: '🇲🇷', Mauritius: '🇲🇺', Mayotte: '🇾🇹', Micronesia: '🇫🇲', Moldova: '🇲🇩', Montenegro: '🇲🇪',
  Montserrat: '🇲🇸', Mozambique: '🇲🇿', Namibia: '🇳🇦', Nauru: '🇳🇷', Nicaragua: '🇳🇮', Niger: '🇳🇪',
  Niue: '🇳🇺', 'North Korea': '🇰🇵', 'North Macedonia': '🇲🇰', 'Northern Mariana Islands': '🇲🇵',
  'New Caledonia': '🇳🇨', Palau: '🇵🇼', Palestine: '🇵🇸', 'Papua New Guinea': '🇵🇬', Paraguay: '🇵🇾', 'Puerto Rico': '🇵🇷',
  Reunion: '🇷🇪', 'Saint Barthelemy': '🇧🇱', 'Saint Helena': '🇸🇭', 'Saint Kitts and Nevis': '🇰🇳',
  'Saint Lucia': '🇱🇨', 'Saint Martin': '🇲🇫', 'Saint Pierre and Miquelon': '🇵🇲',
  'Saint Vincent and the Grenadines': '🇻🇨', Samoa: '🇼🇸', 'San Marino': '🇸🇲', 'Sao Tome and Principe': '🇸🇹', Seychelles: '🇸🇨',
  'Sierra Leone': '🇸🇱', 'Sint Maarten': '🇸🇽', 'Solomon Islands': '🇸🇧', Somalia: '🇸🇴', 'South Sudan': '🇸🇸',
  Suriname: '🇸🇷', 'Svalbard and Jan Mayen': '🇸🇯', Tajikistan: '🇹🇯', Tanzania: '🇹🇿', 'Timor-Leste': '🇹🇱',
  Togo: '🇹🇬', Tokelau: '🇹🇰', Tonga: '🇹🇴', 'Trinidad and Tobago': '🇹🇹', Turkmenistan: '🇹🇲', 'Turks and Caicos Islands': '🇹🇨',
  Tuvalu: '🇹🇻', Uganda: '🇺🇬', Vanuatu: '🇻🇺', 'Vatican City': '🇻🇦', 'Virgin Islands, British': '🇻🇬',
  'Virgin Islands, U.S.': '🇻🇮', 'Wallis and Futuna': '🇼🇫', 'Western Sahara': '🇪🇭',
};

const getCountryFlag = (countryName) => COUNTRY_FLAGS[countryName] || '🌐';

const PhoneInput = ({ value, onChange, className = '', inputClassName = '', ...props }) => {
  const [countryCode, setCountryCode] = useState(() => getInitialCountry(value));
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const localNumber = getLocalNumber(value, countryCode);

  useEffect(() => {
    const nextCountry = getInitialCountry(value);
    if (String(value || '').startsWith('+') && nextCountry !== countryCode) setCountryCode(nextCountry);
  }, [value, countryCode]);

  const updateNumber = (nextValue) => {
    const digits = nextValue.replace(/\D/g, '').slice(0, countryCode === '+63' ? 10 : 15);
    onChange(`${countryCode}${digits}`);
  };

  const updateCountry = (nextCountry) => {
    setCountryCode(nextCountry);
    onChange(`${nextCountry}${localNumber}`);
  };

  return (
    <div className={`relative flex border ${className}`}>
      <button
        type="button"
        onClick={() => setCountryMenuOpen((open) => !open)}
        aria-label="Select country code"
        aria-expanded={countryMenuOpen}
        title={`Country code ${countryCode}`}
        className="flex w-[58px] shrink-0 items-center justify-center border-r border-inherit bg-transparent text-sm font-semibold outline-none"
      >
        {countryCode}
      </button>
      {countryMenuOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-1 max-h-64 w-64 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 text-left shadow-lg">
          {COUNTRY_CODES.map((country, index) => (
            <button
              type="button"
              key={`${country.name}-${country.code}-${index}`}
              onClick={() => {
                updateCountry(country.code);
                setCountryMenuOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-xs hover:bg-slate-50 ${country.code === countryCode ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700'}`}
            >
              {country.name} ({country.code})
            </button>
          ))}
        </div>
      )}
      <input
        {...props}
        type="tel"
        inputMode="numeric"
        value={localNumber}
        onChange={(event) => updateNumber(event.target.value)}
        className={`min-w-0 flex-1 border-0 bg-transparent px-3 outline-none ${inputClassName}`}
        placeholder={countryCode === '+63' ? '9171234567' : 'Phone number'}
      />
    </div>
  );
};

export default PhoneInput;
