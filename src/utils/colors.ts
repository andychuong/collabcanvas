// Generate a random color for user cursors
export const getUserColor = (userId: string): string => {
  const colors = [
    '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
    '#E0BBE4', '#FFDFD3', '#C7CEEA', '#D4F1F4', '#FEC8D8',
    '#B5EAD7', '#C8E6C9', '#FFF9C4', '#FFCCBC', '#D1C4E9'
  ];
  
  // Use user ID to deterministically pick a color
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export const getRandomColor = (): string => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
  return colors[Math.floor(Math.random() * colors.length)];
};

