
export const determineFuelType = (engineName: string): string => {
  const lowerName = engineName.toLowerCase();
  if (lowerName.includes('diesel') || lowerName.includes('tdi') || lowerName.includes('bluetec') || lowerName.match(/\bd\d/) || lowerName.includes('cdi')) return 'Diesel';
  if (lowerName.includes('electric') || lowerName.includes('ev') || lowerName.includes('e-tron') || lowerName.includes('eqs') || lowerName.includes('taycan') || lowerName.includes('id.')) return 'Electric';
  if ((lowerName.includes('hybrid') && lowerName.includes('plug')) || lowerName.includes('phev') || lowerName.includes('e:phev')) return 'Plug-in Hybrid';
  if (lowerName.includes('hybrid') || lowerName.includes('e:hev') || lowerName.includes('e-power')) return 'Hybrid';
  if (lowerName.includes('mild hybrid') || lowerName.includes('mhev') || lowerName.includes('etsi')) return 'Mild Hybrid';
  return 'Petrol';
};
