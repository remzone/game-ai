export const OPTIONS={
 race:['Человек','Эльф','Тёмный эльф','Орк','Дворф','Гоблин'],
 sex:['Мужской','Женский'],
 frame:['Крепкое','Стройное'],
 face:['Резкие черты','Мягкие черты','Широкие скулы'],
 skin:['Светлая','Средняя','Тёмная'],eyes:['Серые','Зелёные','Карие','Янтарные'],
 hair:['Боковой пробор','Длинные волны','Коса','Бритая голова','Пучки','Короткая стрижка'],
 dye:['Уголь','Каштан','Седина','Медь','Пепельный блонд'],
 armor:['Дорожная одежда','Пограничный доспех','Одежда следопыта'],
};
export const DEFAULT={race:0,sex:0,frame:0,face:0,skin:1,eyes:0,hair:1,dye:1,armor:0};
export const SPECIES=[
 {x:1,y:1,z:1,head:1,ear:0,jaw:1,brow:0,nose:0,skins:[0xc8a184,0xad8065,0x774f39],text:'Средний рост и обычные человеческие пропорции.'},
 {x:.90,y:1.048,z:.96,head:.97,ear:.074,jaw:.83,brow:-.005,nose:-.002,skins:[0xd7bca1,0xba926f,0x815b46],text:'Высокий и узкоплечий силуэт, тонкая челюсть и длинные уши.'},
 {x:.94,y:1.02,z:.95,head:1,ear:.090,jaw:.87,brow:.004,nose:.002,skins:[0x96909e,0x736c86,0x514a62],text:'Длинные уши, резкие скулы и холодные тона кожи.'},
 {x:1.23,y:1.083,z:1.14,head:1.13,ear:.046,jaw:1.34,brow:.018,nose:.004,skins:[0x8b9960,0x69794a,0x4d5b3c],text:'Высокий, широкоплечий силуэт, тяжёлая челюсть и клыки.'},
 {x:1.15,y:.785,z:1.13,head:1.14,ear:.013,jaw:1.15,brow:.010,nose:.005,skins:[0xc89675,0xa77150,0x774a36],text:'Низкий и коренастый силуэт, широкое лицо и выраженные брови.'},
 {x:.805,y:.775,z:.90,head:1.14,ear:.114,jaw:.88,brow:.013,nose:.027,skins:[0x9ca579,0x777f50,0x505c3b],text:'Маленький и непропорционально большеголовый силуэт, острые уши и длинный нос.'}
];
export function validateLook(obj){
 const saved=obj??{};
 // Frame selected the male or female outfit in the earlier save format.
 const legacy=saved.sex===undefined&&Number.isInteger(saved.frame)?{...saved,sex:saved.frame}:saved;
 return Object.fromEntries(Object.entries(OPTIONS).map(([key,list])=>[key,Number.isInteger(legacy[key])&&legacy[key]>=0&&legacy[key]<list.length?legacy[key]:DEFAULT[key]]));
}
export function bodyScale(look){
 const r=SPECIES[look.race];
 return [r.x*(look.frame?.95:1.045),r.y,r.z*(look.frame?.965:1.028)];
}
export const outfitKey=({sex,armor})=>(sex===1?'female':'male')+(armor===0?'Peasant':'Ranger');
