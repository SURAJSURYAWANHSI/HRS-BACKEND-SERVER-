// RAL Color Code Mapping
// Common RAL colors used in manufacturing

export const RAL_COLORS: { [key: string]: string } = {
    // Whites and Grays
    'RAL 9010': '#F1EDE3', // Pure White
    'RAL 9016': '#F1F0EA', // Traffic White
    'RAL 9001': '#E9E0D2', // Cream
    'RAL 9002': '#D7D5CB', // Grey White
    'RAL 9003': '#EDEAE2', // Signal White
    'RAL 9005': '#0A0A0D', // Jet Black
    'RAL 9006': '#A1A1A0', // White Aluminium
    'RAL 9007': '#878581', // Grey Aluminium
    'RAL 7035': '#CBD0CC', // Light Grey
    'RAL 7036': '#9A9697', // Platinum Grey
    'RAL 7037': '#7A7B7A', // Dusty Grey
    'RAL 7038': '#B4B8B0', // Agate Grey
    'RAL 7039': '#6B665F', // Quartz Grey
    'RAL 7040': '#9FA3A6', // Window Grey
    'RAL 7042': '#8F9695', // Traffic Grey A
    'RAL 7043': '#4E5451', // Traffic Grey B
    'RAL 7044': '#B8B0A0', // Silk Grey
    'RAL 7016': '#373F43', // Anthracite Grey

    // Yellows
    'RAL 1003': '#F1AB00', // Signal Yellow
    'RAL 1023': '#F7B500', // Traffic Yellow
    'RAL 1021': '#EEC900', // Rape Yellow
    'RAL 1018': '#F3D600', // Zinc Yellow
    'RAL 1037': '#F09200', // Sun Yellow

    // Oranges
    'RAL 2004': '#E25303', // Pure Orange
    'RAL 2008': '#E74700', // Bright Red Orange
    'RAL 2009': '#DE5307', // Traffic Orange
    'RAL 2010': '#D2570A', // Signal Orange
    'RAL 2011': '#E26E0E', // Deep Orange

    // Reds
    'RAL 3000': '#A72920', // Flame Red
    'RAL 3001': '#9B2423', // Signal Red
    'RAL 3002': '#9B2321', // Carmine Red
    'RAL 3003': '#861A22', // Ruby Red
    'RAL 3004': '#6B1C23', // Purple Red
    'RAL 3005': '#59191F', // Wine Red
    'RAL 3020': '#BB1E10', // Traffic Red

    // Blues
    'RAL 5005': '#005387', // Signal Blue
    'RAL 5010': '#004F7C', // Gentian Blue
    'RAL 5012': '#0089B6', // Light Blue
    'RAL 5015': '#007CB0', // Sky Blue
    'RAL 5017': '#005B8C', // Traffic Blue
    'RAL 5019': '#005E83', // Capri Blue
    'RAL 5024': '#0089B6', // Pastel Blue

    // Greens
    'RAL 6005': '#0F4336', // Moss Green
    'RAL 6018': '#61993B', // Yellow Green
    'RAL 6024': '#008754', // Traffic Green
    'RAL 6029': '#006F3D', // Mint Green
    'RAL 6032': '#007F4E', // Signal Green

    // Browns
    'RAL 8001': '#9D622B', // Ochre Brown
    'RAL 8003': '#7E4B26', // Clay Brown
    'RAL 8004': '#8D4931', // Copper Brown
    'RAL 8007': '#6F4A2F', // Fawn Brown
    'RAL 8008': '#6F4F28', // Olive Brown
    'RAL 8011': '#5A3A29', // Nut Brown
    'RAL 8012': '#5A3A29', // Red Brown
    'RAL 8014': '#49392D', // Sepia Brown
    'RAL 8015': '#5B2E27', // Chestnut Brown
    'RAL 8017': '#442F29', // Chocolate Brown
    'RAL 8019': '#3D3635', // Grey Brown
};

/**
 * Get hex color from RAL code
 * @param ralCode - RAL code (e.g., "RAL 7035" or "7035")
 * @returns Hex color code or null if not found
 */
export const getColorFromRAL = (ralCode: string): string | null => {
    if (!ralCode) return null;

    // Normalize the input - handle "RAL 7035", "RAL7035", "7035"
    const normalized = ralCode.toUpperCase().trim();
    const withRAL = normalized.startsWith('RAL') ? normalized : `RAL ${normalized}`;

    // Ensure proper spacing: "RAL 7035"
    const formatted = withRAL.replace(/RAL\s*(\d+)/, 'RAL $1');

    return RAL_COLORS[formatted] || null;
};

/**
 * Check if a RAL code is valid
 * @param ralCode - RAL code to validate
 * @returns true if the code exists in our database
 */
export const isValidRAL = (ralCode: string): boolean => {
    return getColorFromRAL(ralCode) !== null;
};
