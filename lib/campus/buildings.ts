// Named NC State buildings with bounding boxes, from OpenStreetMap
// (© OpenStreetMap contributors, ODbL). Snapshot 2026-09-26, with name typos fixed.
export type CampusBuilding = {
  name: string;
  // [south, west, north, east]
  bounds: [number, number, number, number];
};
export const campusBuildings: CampusBuilding[] = [
  {
    name: "111 Lampe Drive",
    bounds: [35.785303, -78.668429, 35.78599, -78.667592],
  },
  {
    name: "1911 Building",
    bounds: [35.786113, -78.667623, 35.786973, -78.667046],
  },
  {
    name: "Administrative Services Annex",
    bounds: [35.787712, -78.68466, 35.788278, -78.68395],
  },
  {
    name: "Administrative Services I",
    bounds: [35.787375, -78.68377, 35.787921, -78.682847],
  },
  {
    name: "Administrative Services II",
    bounds: [35.786849, -78.682636, 35.787293, -78.682042],
  },
  {
    name: "Administrative Services III",
    bounds: [35.786247, -78.682023, 35.786839, -78.681374],
  },
  {
    name: "Alexander Residence Hall",
    bounds: [35.784081, -78.672217, 35.784745, -78.671733],
  },
  {
    name: "Alliance Deck",
    bounds: [35.77209, -78.676478, 35.772934, -78.675294],
  },
  {
    name: "Alliance One",
    bounds: [35.772486, -78.677114, 35.773323, -78.676491],
  },
  {
    name: "Alpha Gamma Rho",
    bounds: [35.778884, -78.684475, 35.779059, -78.684159],
  },
  {
    name: "Arboretum HFL Support Building",
    bounds: [35.790834, -78.698912, 35.790934, -78.698716],
  },
  {
    name: "Arboretum Support Office Building",
    bounds: [35.793491, -78.699414, 35.793718, -78.699273],
  },
  {
    name: "Arctic Hall (Building A)",
    bounds: [35.786857, -78.68522, 35.787345, -78.68466],
  },
  {
    name: "Avent Ferry Complex",
    bounds: [35.779322, -78.678435, 35.780062, -78.676992],
  },
  {
    name: "Baffin Hall (Building B)",
    bounds: [35.786538, -78.686105, 35.787131, -78.685639],
  },
  {
    name: "Bagwell Residence Hall",
    bounds: [35.782091, -78.666159, 35.782802, -78.665666],
  },
  { name: "Beaufort", bounds: [35.787833, -78.688902, 35.788303, -78.688323] },
  {
    name: "Becton Residence Hall",
    bounds: [35.782286, -78.666682, 35.783001, -78.666213],
  },
  {
    name: "Berry Residence Hall",
    bounds: [35.78202, -78.666594, 35.782246, -78.666207],
  },
  { name: "Bertie", bounds: [35.78761, -78.689864, 35.787715, -78.689414] },
  {
    name: "Beta Theta Pi",
    bounds: [35.781211, -78.682589, 35.781412, -78.68238],
  },
  {
    name: "Biltmore Hall",
    bounds: [35.781924, -78.67756, 35.782374, -78.676933],
  },
  {
    name: "Biltmore Hall / Robertson Wing",
    bounds: [35.782172, -78.678062, 35.782563, -78.677501],
  },
  {
    name: "Biological Resources Facility",
    bounds: [35.786787, -78.673088, 35.787225, -78.672824],
  },
  {
    name: "Biomedical Partnership Center",
    bounds: [35.795333, -78.705606, 35.796008, -78.704914],
  },
  { name: "Bladen", bounds: [35.787253, -78.691033, 35.787358, -78.690581] },
  {
    name: "Bostian Hall",
    bounds: [35.787033, -78.672037, 35.7879, -78.671581],
  },
  {
    name: "Bowen Residence Hall",
    bounds: [35.785519, -78.673782, 35.785764, -78.673402],
  },
  {
    name: "Bragaw Residence Hall",
    bounds: [35.784894, -78.677246, 35.786395, -78.675628],
  },
  {
    name: "Brooks Hall",
    bounds: [35.784078, -78.665188, 35.784866, -78.664568],
  },
  {
    name: "Broughton Hall",
    bounds: [35.785142, -78.670643, 35.785789, -78.669576],
  },
  {
    name: "Bureau of Mines",
    bounds: [35.785473, -78.671026, 35.785786, -78.670768],
  },
  {
    name: "Burlington Engineering Laboratories",
    bounds: [35.785645, -78.669202, 35.786363, -78.668498],
  },
  {
    name: "Butler Communications Building",
    bounds: [35.783777, -78.681906, 35.784302, -78.681004],
  },
  {
    name: "Caldwell Hall",
    bounds: [35.786679, -78.666079, 35.787026, -78.665503],
  },
  {
    name: "Carmichael Gymnasium",
    bounds: [35.782544, -78.673794, 35.784186, -78.671116],
  },
  {
    name: "Carmichael Recreation Center",
    bounds: [35.782469, -78.671908, 35.782896, -78.671276],
  },
  {
    name: "Carroll Residence Hall",
    bounds: [35.785202, -78.672874, 35.785446, -78.672496],
  },
  { name: "Carteret", bounds: [35.787346, -78.689334, 35.78744, -78.688937] },
  {
    name: "Case Academic Center",
    bounds: [35.782679, -78.669792, 35.782994, -78.66937],
  },
  {
    name: "Caspian Hall (Building C)",
    bounds: [35.786203, -78.685976, 35.786656, -78.68525],
  },
  {
    name: "CBC Parking Garage",
    bounds: [35.797182, -78.706795, 35.797797, -78.705791],
  },
  {
    name: "CBC Research Building",
    bounds: [35.796972, -78.705701, 35.797626, -78.705239],
  },
  {
    name: "Centennial Biomedical Campus Facilities Service Center",
    bounds: [35.801847, -78.705758, 35.802323, -78.705438],
  },
  {
    name: "Centennial Biomedical Campus Utility Plant",
    bounds: [35.80025, -78.704538, 35.800438, -78.704136],
  },
  {
    name: "Center for Technology and Innovation",
    bounds: [35.770781, -78.678675, 35.771352, -78.677765],
  },
  {
    name: "Center for Technology and Innovation Parking Deck",
    bounds: [35.771045, -78.679389, 35.771478, -78.678639],
  },
  {
    name: "Chancellor's Residence",
    bounds: [35.761824, -78.682924, 35.762141, -78.682337],
  },
  {
    name: "Cherry Building",
    bounds: [35.771459, -78.666589, 35.772142, -78.666021],
  },
  { name: "Chowan", bounds: [35.788762, -78.687923, 35.788866, -78.687473] },
  {
    name: "Clark Hall",
    bounds: [35.781957, -78.667129, 35.782315, -78.666556],
  },
  {
    name: "Close-King Indoor Practice",
    bounds: [35.800993, -78.716566, 35.802276, -78.715797],
  },
  {
    name: "Coliseum Parking Deck",
    bounds: [35.7821, -78.668883, 35.783639, -78.667097],
  },
  {
    name: "College of Agriculture and Life Sciences",
    bounds: [35.794191, -78.696809, 35.794614, -78.696399],
  },
  {
    name: "College of Veterinary Medicine Annex",
    bounds: [35.799513, -78.706647, 35.799945, -78.70639],
  },
  {
    name: "College of Veterinary Medicine Main Building",
    bounds: [35.797541, -78.70465, 35.799726, -78.703277],
  },
  {
    name: "Constructed Facilities Lab (ERC)",
    bounds: [35.7685, -78.679751, 35.768949, -78.679406],
  },
  {
    name: "Council Building",
    bounds: [35.77341, -78.667676, 35.774221, -78.666976],
  },
  { name: "Cox Hall", bounds: [35.785876, -78.671137, 35.786233, -78.670779] },
  { name: "Craven", bounds: [35.787267, -78.688126, 35.787362, -78.687714] },
  { name: "Currituck", bounds: [35.788393, -78.688349, 35.788799, -78.688187] },
  {
    name: "D. H. Hill Library",
    bounds: [35.787242, -78.670451, 35.787849, -78.669076],
  },
  {
    name: "Dabney Hall",
    bounds: [35.785834, -78.671556, 35.786277, -78.671053],
  },
  {
    name: "Dan Allen Parking Deck",
    bounds: [35.787183, -78.676831, 35.788213, -78.674779],
  },
  {
    name: "David Clark Laboratories",
    bounds: [35.78698, -78.674536, 35.787903, -78.673803],
  },
  {
    name: "Dearstyne Entomology",
    bounds: [35.788598, -78.699237, 35.78891, -78.698988],
  },
  {
    name: "Delta Gamma",
    bounds: [35.778429, -78.681705, 35.778769, -78.681417],
  },
  {
    name: "Delta Zeta",
    bounds: [35.780918, -78.681897, 35.781215, -78.681507],
  },
  {
    name: "Don E. Ellis Laboratories",
    bounds: [35.781365, -78.684811, 35.781597, -78.684576],
  },
  {
    name: "Dorothy and Roy Park Alumni Center",
    bounds: [35.762488, -78.679864, 35.763042, -78.679186],
  },
  { name: "East Barn", bounds: [35.798769, -78.702669, 35.799081, -78.702341] },
  { name: "Edgecombe", bounds: [35.78784, -78.690874, 35.788311, -78.690292] },
  {
    name: "Engineering Building I (EB1)",
    bounds: [35.771175, -78.675521, 35.772082, -78.674482],
  },
  {
    name: "Engineering Building III (EB3)",
    bounds: [35.770239, -78.674171, 35.771423, -78.67295],
  },
  {
    name: "Environmental Health and Safety Center",
    bounds: [35.78516, -78.682952, 35.785819, -78.682408],
  },
  {
    name: "Erdahl Cloyd Wing",
    bounds: [35.787507, -78.67092, 35.787967, -78.670222],
  },
  {
    name: "ES King Village Commons",
    bounds: [35.787355, -78.688762, 35.787715, -78.68845],
  },
  {
    name: "FER(Forestry and Environmental Resources) Graduate Facility",
    bounds: [35.7777, -78.683076, 35.777824, -78.682876],
  },
  {
    name: "Fitts-Woolard Hall",
    bounds: [35.770091, -78.67646, 35.771248, -78.67523],
  },
  {
    name: "Football Practice Facility",
    bounds: [35.802816, -78.715935, 35.803172, -78.715438],
  },
  {
    name: "Fountain Dining Hall",
    bounds: [35.785136, -78.678017, 35.785816, -78.677282],
  },
  {
    name: "Gardner Hall",
    bounds: [35.786725, -78.672715, 35.78779, -78.671837],
  },
  {
    name: "Gold Residence Hall",
    bounds: [35.783758, -78.665237, 35.784035, -78.664974],
  },
  {
    name: "Golden LEAF Biomanufacturing Training and Education Center (BTEC)",
    bounds: [35.77257, -78.674407, 35.773446, -78.673514],
  },
  { name: "Granville", bounds: [35.788445, -78.691764, 35.788547, -78.691315] },
  {
    name: "Gray Hall (Building G)",
    bounds: [35.78608, -78.684989, 35.786396, -78.684244],
  },
  {
    name: "Greek Village Apartments",
    bounds: [35.780172, -78.681161, 35.780574, -78.680479],
  },
  {
    name: "Greek Village Townhomes",
    bounds: [35.780773, -78.680228, 35.781148, -78.679827],
  },
  {
    name: "Greenhouse 430",
    bounds: [35.793467, -78.699181, 35.793744, -78.699102],
  },
  {
    name: "Greenhouse 450-454",
    bounds: [35.791763, -78.699191, 35.791839, -78.698938],
  },
  {
    name: "Greenhouse Ufl 411",
    bounds: [35.792135, -78.699033, 35.792246, -78.698946],
  },
  {
    name: "Greenhouse Ufl 412",
    bounds: [35.791933, -78.698923, 35.792047, -78.698836],
  },
  {
    name: "Greenhouse Ufl 414",
    bounds: [35.791941, -78.699058, 35.792057, -78.698969],
  },
  {
    name: "Greenhouse Ufl 415",
    bounds: [35.792143, -78.699158, 35.792257, -78.69907],
  },
  {
    name: "Greenhouse Ufl 416",
    bounds: [35.791951, -78.699179, 35.792065, -78.699093],
  },
  {
    name: "Greenhouse Ufl 417",
    bounds: [35.792152, -78.699284, 35.792268, -78.699201],
  },
  {
    name: "Greenhouse Ufl 418",
    bounds: [35.791961, -78.699303, 35.792072, -78.699221],
  },
  {
    name: "Greenhouse UFL 435",
    bounds: [35.792367, -78.699077, 35.79262, -78.698798],
  },
  {
    name: "Gregg Museum of Art and Design",
    bounds: [35.784707, -78.661954, 35.785151, -78.661456],
  },
  {
    name: "Grinnells Animal Health Laboratory",
    bounds: [35.783537, -78.681161, 35.784138, -78.680274],
  },
  {
    name: "Grove Hall",
    bounds: [35.768184, -78.673599, 35.768982, -78.673339],
  },
  {
    name: "Harris Hall",
    bounds: [35.785431, -78.674682, 35.78585, -78.674174],
  },
  {
    name: "Hillsborough Building",
    bounds: [35.788483, -78.67075, 35.788807, -78.670351],
  },
  {
    name: "Hodges Wood Products Laboratory",
    bounds: [35.782719, -78.6776, 35.783226, -78.67691],
  },
  {
    name: "Holladay Hall",
    bounds: [35.785247, -78.664129, 35.785716, -78.663901],
  },
  {
    name: "Holmes Hall",
    bounds: [35.784188, -78.674364, 35.78449, -78.673833],
  },
  {
    name: "Horticulture Greenhouse A",
    bounds: [35.791065, -78.698362, 35.79122, -78.697545],
  },
  {
    name: "Horticulture Greenhouse B",
    bounds: [35.79088, -78.698368, 35.791035, -78.697556],
  },
  {
    name: "Horticulture Headhouse",
    bounds: [35.790894, -78.697537, 35.791201, -78.697318],
  },
  {
    name: "Horticulture Headhouse and Greenhouses",
    bounds: [35.791331, -78.698403, 35.791783, -78.697057],
  },
  {
    name: "Horticulture Shed Ufl 441",
    bounds: [35.790853, -78.697228, 35.791324, -78.69709],
  },
  {
    name: "Horticulture Storage UFL 439",
    bounds: [35.791673, -78.697444, 35.791783, -78.69725],
  },
  {
    name: "Hudson Hall (Building H)",
    bounds: [35.786498, -78.685147, 35.786807, -78.684378],
  },
  { name: "Hyde", bounds: [35.78841, -78.689518, 35.788517, -78.688921] },
  {
    name: "Information Booth",
    bounds: [35.774518, -78.679267, 35.774586, -78.679161],
  },
  {
    name: "Innovation Hall",
    bounds: [35.768268, -78.673146, 35.769034, -78.672588],
  },
  {
    name: "J W Isenhour Tennis Complex",
    bounds: [35.787252, -78.681501, 35.787824, -78.680477],
  },
  {
    name: "James B. Hunt Jr. Library (JHL)",
    bounds: [35.768672, -78.676841, 35.76992, -78.676046],
  },
  {
    name: "Johnson Poole Clubhouse",
    bounds: [35.759888, -78.677514, 35.760297, -78.67693],
  },
  { name: "Johnston", bounds: [35.787403, -78.691417, 35.787771, -78.691287] },
  {
    name: "Jordan Hall",
    bounds: [35.781601, -78.676922, 35.782064, -78.676017],
  },
  {
    name: "Jordan Hall Addition",
    bounds: [35.781495, -78.676165, 35.781723, -78.675465],
  },
  {
    name: "Kamphoefner Hall",
    bounds: [35.784418, -78.665722, 35.784876, -78.665121],
  },
  {
    name: "Kappa Alpha",
    bounds: [35.781591, -78.68226, 35.781778, -78.681958],
  },
  { name: "Kappa Delta", bounds: [35.77854, -78.681329, 35.778837, -78.681] },
  {
    name: "Keystone Deck",
    bounds: [35.774587, -78.677581, 35.77527, -78.67719],
  },
  {
    name: "Keystone Science Center (KS1)",
    bounds: [35.773885, -78.677794, 35.77454, -78.676782],
  },
  {
    name: "Kilgore Hall",
    bounds: [35.788023, -78.673365, 35.788436, -78.672492],
  },
  {
    name: "Koch Hall (Engineering Building II)",
    bounds: [35.771407, -78.674747, 35.772471, -78.67298],
  },
  {
    name: "Lakeview Hall",
    bounds: [35.769114, -78.674454, 35.769631, -78.673599],
  },
  {
    name: "Lambda Chi Alpha",
    bounds: [35.780654, -78.68177, 35.780934, -78.681416],
  },
  {
    name: "Language and Computer Laboratories",
    bounds: [35.784666, -78.667723, 35.785102, -78.66741],
  },
  {
    name: "Leazar Hall",
    bounds: [35.785168, -78.665896, 35.785613, -78.665213],
  },
  {
    name: "Lee Residence Hall",
    bounds: [35.785614, -78.678175, 35.786658, -78.677468],
  },
  {
    name: "Mackenzie Hall (Building F)",
    bounds: [35.78605, -78.684137, 35.786504, -78.683523],
  },
  {
    name: "MAE Laboratory",
    bounds: [35.789468, -78.699213, 35.789943, -78.698978],
  },
  {
    name: "Magnolia Cottage",
    bounds: [35.779545, -78.677149, 35.780465, -78.676389],
  },
  {
    name: "Maintenance Facility",
    bounds: [35.759575, -78.681394, 35.759804, -78.680779],
  },
  { name: "Mann Hall", bounds: [35.785023, -78.669535, 35.785503, -78.668824] },
  {
    name: "Marye Anne Fox Science Teaching Laboratory",
    bounds: [35.786961, -78.673838, 35.787416, -78.673074],
  },
  {
    name: "Materials Support Warehouse",
    bounds: [35.788176, -78.700916, 35.789048, -78.699574],
  },
  {
    name: "McKimmon Center",
    bounds: [35.781999, -78.68575, 35.783405, -78.684458],
  },
  {
    name: "MEAS Field Lab",
    bounds: [35.781309, -78.684032, 35.781541, -78.683469],
  },
  {
    name: "Memorial Belltower",
    bounds: [35.786078, -78.663579, 35.786204, -78.663421],
  },
  {
    name: "Metcalf Residence Hall",
    bounds: [35.785364, -78.673319, 35.78561, -78.672939],
  },
  {
    name: "Milking Parlor",
    bounds: [35.798621, -78.702876, 35.79873, -78.702618],
  },
  {
    name: "Monteith Deck",
    bounds: [35.76907, -78.678949, 35.769691, -78.678432],
  },
  {
    name: "Monteith Engineering Research Center (MRC)",
    bounds: [35.769027, -78.679351, 35.769877, -78.678816],
  },
  {
    name: "Murphy Football Center",
    bounds: [35.799487, -78.718998, 35.800158, -78.718149],
  },
  {
    name: "NCSU Cates Cogeneration Plant",
    bounds: [35.783879, -78.67489, 35.784279, -78.674533],
  },
  {
    name: "NCSU CCUP Cogeneration Plant",
    bounds: [35.77543, -78.674076, 35.775746, -78.672989],
  },
  {
    name: "Nelson Hall",
    bounds: [35.787965, -78.674408, 35.788757, -78.673526],
  },
  {
    name: "New Hanover",
    bounds: [35.787249, -78.690451, 35.787354, -78.689998],
  },
  {
    name: "North Residence Hall",
    bounds: [35.787094, -78.665064, 35.787426, -78.664346],
  },
  {
    name: "Northampton",
    bounds: [35.78883, -78.691215, 35.788936, -78.690769],
  },
  { name: "Onslow", bounds: [35.788826, -78.690381, 35.788931, -78.68993] },
  {
    name: "Oval West Parking Deck (PWD)",
    bounds: [35.770961, -78.676857, 35.771888, -78.67583],
  },
  {
    name: "Owen Residence Hall",
    bounds: [35.784322, -78.673597, 35.785105, -78.672692],
  },
  { name: "Page Hall", bounds: [35.785745, -78.667265, 35.786071, -78.666647] },
  { name: "Park Shops", bounds: [35.785228, -78.667491, 35.785807, -78.66675] },
  {
    name: "Partners Building I",
    bounds: [35.770127, -78.677664, 35.771007, -78.677009],
  },
  {
    name: "Partners Building II (PT2)",
    bounds: [35.774943, -78.67613, 35.775565, -78.675428],
  },
  {
    name: "Partners Building III (PT3)",
    bounds: [35.773702, -78.676139, 35.77427, -78.675349],
  },
  {
    name: "Partners Way Parking Deck",
    bounds: [35.772658, -78.675525, 35.774499, -78.673756],
  },
  {
    name: "Pasquotank",
    bounds: [35.788245, -78.687944, 35.788383, -78.687442],
  },
  {
    name: "Patterson Hall",
    bounds: [35.786906, -78.668851, 35.787244, -78.668113],
  },
  { name: "Peele Hall", bounds: [35.78575, -78.664815, 35.785923, -78.664355] },
  {
    name: "Perquimans",
    bounds: [35.787415, -78.687528, 35.788076, -78.687414],
  },
  {
    name: "Pfiesteria Research Laboratory",
    bounds: [35.789233, -78.699663, 35.789511, -78.699483],
  },
  { name: "Phytotron", bounds: [35.787237, -78.672742, 35.787653, -78.672128] },
  {
    name: "Pi Beta Phi",
    bounds: [35.78144, -78.681723, 35.781702, -78.681395],
  },
  {
    name: "Plant Pathology Equipment Shed",
    bounds: [35.791094, -78.699684, 35.791141, -78.699546],
  },
  {
    name: "Plant Sciences Building",
    bounds: [35.773544, -78.67375, 35.774238, -78.672583],
  },
  { name: "Plaza Hall", bounds: [35.769204, -78.673704, 35.769891, -78.67292] },
  { name: "Poe Hall", bounds: [35.785403, -78.666669, 35.785896, -78.666064] },
  { name: "Polk Hall", bounds: [35.785822, -78.670349, 35.786458, -78.669498] },
  {
    name: "Potting House UFL 436",
    bounds: [35.791675, -78.697597, 35.791791, -78.697446],
  },
  {
    name: "Poulton Deck",
    bounds: [35.768865, -78.677495, 35.769603, -78.676929],
  },
  {
    name: "Poulton Innovation Center (Corporate Research I)",
    bounds: [35.768957, -78.677929, 35.769767, -78.677336],
  },
  {
    name: "Price Music Center",
    bounds: [35.783844, -78.671988, 35.784376, -78.671415],
  },
  {
    name: "Primrose Hall",
    bounds: [35.786386, -78.664497, 35.786507, -78.664321],
  },
  {
    name: "Public Safety Center",
    bounds: [35.785311, -78.682485, 35.785758, -78.681862],
  },
  {
    name: "Pullen Hall",
    bounds: [35.785549, -78.675045, 35.785907, -78.674587],
  },
  {
    name: "Pulp and Paper Laboratories / Biltmore Hall",
    bounds: [35.782326, -78.678449, 35.782894, -78.677814],
  },
  {
    name: "Quad Commons",
    bounds: [35.782653, -78.666213, 35.782907, -78.66587],
  },
  {
    name: "Red Hall (Building D)",
    bounds: [35.785782, -78.685769, 35.786263, -78.68505],
  },
  {
    name: "Research I",
    bounds: [35.770693, -78.680811, 35.771273, -78.680472],
  },
  {
    name: "Research II",
    bounds: [35.769777, -78.681005, 35.770456, -78.680589],
  },
  {
    name: "Research III",
    bounds: [35.770513, -78.681355, 35.770792, -78.680898],
  },
  {
    name: "Research IV",
    bounds: [35.771793, -78.680843, 35.772624, -78.68018],
  },
  {
    name: "Reynolds Coliseum",
    bounds: [35.782953, -78.67043, 35.784096, -78.669383],
  },
  {
    name: "Ricks Hall",
    bounds: [35.786784, -78.667892, 35.787315, -78.667377],
  },
  {
    name: "Riddick Hall (Riddick Engineering Labs)",
    bounds: [35.784727, -78.668901, 35.785301, -78.667827],
  },
  {
    name: "Ruby McSwain Education Building",
    bounds: [35.794097, -78.699898, 35.794376, -78.699315],
  },
  { name: "SAS Hall", bounds: [35.784571, -78.667329, 35.785223, -78.666356] },
  {
    name: "Schaub Food Science Building",
    bounds: [35.783546, -78.678457, 35.784227, -78.677578],
  },
  { name: "Scott Hall", bounds: [35.787757, -78.672281, 35.788297, -78.67129] },
  { name: "Sigma Nu", bounds: [35.77876, -78.680634, 35.779125, -78.680199] },
  {
    name: "Sigma Phi Epsilon",
    bounds: [35.778613, -78.680964, 35.778945, -78.680594],
  },
  {
    name: "Solar House",
    bounds: [35.781975, -78.686003, 35.782085, -78.685821],
  },
  {
    name: "Spring Hill House",
    bounds: [35.772565, -78.66694, 35.772723, -78.666697],
  },
  {
    name: "Student Health Center",
    bounds: [35.784354, -78.675743, 35.78493, -78.674688],
  },
  {
    name: "Sullivan Residence Hall",
    bounds: [35.786671, -78.677869, 35.787137, -78.676987],
  },
  {
    name: "Sullivan Shops Building III",
    bounds: [35.789656, -78.684926, 35.790082, -78.684432],
  },
  {
    name: "Sullivan Shops II",
    bounds: [35.788139, -78.682632, 35.788701, -78.681895],
  },
  {
    name: "Syme Residence Hall",
    bounds: [35.783632, -78.66603, 35.784268, -78.665542],
  },
  {
    name: "Talley Student Union",
    bounds: [35.78337, -78.671661, 35.784652, -78.669976],
  },
  {
    name: "Teaching Animal Unit",
    bounds: [35.799203, -78.702179, 35.799468, -78.701929],
  },
  {
    name: "Terry Companion Animal Veterinary Center",
    bounds: [35.796302, -78.704569, 35.797454, -78.703507],
  },
  {
    name: "Thomas Hall",
    bounds: [35.786231, -78.673007, 35.786745, -78.672326],
  },
  {
    name: "Thompson Hall",
    bounds: [35.782333, -78.667227, 35.783093, -78.666635],
  },
  {
    name: "Timber Hall (Building E)",
    bounds: [35.785657, -78.684495, 35.78603, -78.683843],
  },
  {
    name: "Tompkins Hall",
    bounds: [35.786459, -78.665584, 35.786864, -78.664764],
  },
  {
    name: "Tower Hall",
    bounds: [35.769661, -78.674696, 35.770449, -78.673607],
  },
  {
    name: "Toxicology (TOX)",
    bounds: [35.774512, -78.676857, 35.775179, -78.676205],
  },
  {
    name: "Toxicology Deck",
    bounds: [35.775046, -78.677126, 35.77558, -78.676454],
  },
  {
    name: "Tucker Residence Hall",
    bounds: [35.784578, -78.67429, 35.785493, -78.673721],
  },
  {
    name: "Turlington Residence Hall",
    bounds: [35.784289, -78.672793, 35.784955, -78.672311],
  },
  {
    name: "Turner House",
    bounds: [35.789353, -78.672968, 35.789485, -78.672757],
  },
  { name: "Tyrrell", bounds: [35.788394, -78.689926, 35.788759, -78.689805] },
  {
    name: "University Club",
    bounds: [35.797833, -78.697097, 35.798282, -78.696062],
  },
  { name: "Valley Hall", bounds: [35.76771, -78.673825, 35.768172, -78.67281] },
  {
    name: "Varsity Research Building",
    bounds: [35.776308, -78.682472, 35.777382, -78.681151],
  },
  {
    name: "Venture I (VC1)",
    bounds: [35.771637, -78.678441, 35.772064, -78.677579],
  },
  {
    name: "Venture II (VC2)",
    bounds: [35.772582, -78.678225, 35.772978, -78.67738],
  },
  {
    name: "Venture III",
    bounds: [35.773162, -78.678073, 35.773668, -78.677239],
  },
  {
    name: "Venture IV",
    bounds: [35.773656, -78.679038, 35.774121, -78.678176],
  },
  {
    name: "Venture Parking",
    bounds: [35.771904, -78.679231, 35.773668, -78.678257],
  },
  {
    name: "Venture Place",
    bounds: [35.772105, -78.678325, 35.772582, -78.67795],
  },
  {
    name: "Visitor Center",
    bounds: [35.79453, -78.699654, 35.794665, -78.699542],
  },
  {
    name: "Watauga Residence Hall",
    bounds: [35.784986, -78.664862, 35.78523, -78.66437],
  },
  {
    name: "Weaver Administration Building",
    bounds: [35.782794, -78.679398, 35.783045, -78.678978],
  },
  {
    name: "Weaver Laboratories",
    bounds: [35.783071, -78.679836, 35.784089, -78.678611],
  },
  {
    name: "Weed Control Laboratory",
    bounds: [35.788924, -78.694929, 35.789049, -78.69458],
  },
  {
    name: "Weisiger Brown Athletic Facility",
    bounds: [35.780118, -78.671284, 35.781064, -78.670039],
  },
  {
    name: "Welch Residence Hall",
    bounds: [35.783441, -78.665418, 35.783716, -78.665154],
  },
  { name: "West Barn", bounds: [35.798772, -78.703139, 35.799081, -78.702814] },
  {
    name: "West Chiller Plant",
    bounds: [35.787364, -78.684365, 35.787628, -78.684059],
  },
  {
    name: "West Dunn Building",
    bounds: [35.785991, -78.675532, 35.786308, -78.675207],
  },
  {
    name: "West Lot Parking Deck",
    bounds: [35.784667, -78.681498, 35.785508, -78.680297],
  },
  {
    name: "Western Boulevard Business Services",
    bounds: [35.784167, -78.685392, 35.784495, -78.684953],
  },
  {
    name: "Western Manor Apartments A, B, C",
    bounds: [35.776511, -78.679915, 35.776926, -78.679596],
  },
  {
    name: "Western Manor Apartments D, E, F",
    bounds: [35.776985, -78.680008, 35.777401, -78.679863],
  },
  {
    name: "Western Manor Apartments G, H",
    bounds: [35.777473, -78.680095, 35.777914, -78.679814],
  },
  {
    name: "Western Manor Apartments I, J",
    bounds: [35.777743, -78.680735, 35.777961, -78.680198],
  },
  {
    name: "Western Manor Apartments K",
    bounds: [35.777647, -78.681311, 35.777875, -78.680864],
  },
  {
    name: "Western Manor Apartments L",
    bounds: [35.777203, -78.681375, 35.777565, -78.681066],
  },
  {
    name: "Western Manor Apartments M",
    bounds: [35.777051, -78.68101, 35.777284, -78.680561],
  },
  {
    name: "Western Manor Apartments N, O",
    bounds: [35.77656, -78.680648, 35.777006, -78.680266],
  },
  {
    name: "Western Manor Apartments P, Q",
    bounds: [35.776136, -78.680653, 35.776468, -78.680108],
  },
  {
    name: "Williams Hall",
    bounds: [35.786222, -78.672156, 35.786947, -78.67128],
  },
  {
    name: "Wilson College of Textiles (TEX)",
    bounds: [35.769812, -78.67959, 35.770866, -78.678001],
  },
  {
    name: "Winslow Hall",
    bounds: [35.784775, -78.664255, 35.785122, -78.663989],
  },
  {
    name: "Winston Hall",
    bounds: [35.786768, -78.666695, 35.787162, -78.666037],
  },
  {
    name: "Withers Hall",
    bounds: [35.786054, -78.668136, 35.786624, -78.667565],
  },
  {
    name: "Witherspoon Student Center",
    bounds: [35.784835, -78.674792, 35.785385, -78.674278],
  },
  {
    name: "Wood Hall A",
    bounds: [35.780307, -78.67403, 35.780843, -78.672575],
  },
  { name: "Wood Hall B", bounds: [35.780827, -78.6738, 35.78101, -78.672724] },
  {
    name: "Wood Hall C",
    bounds: [35.78054, -78.672705, 35.780698, -78.672537],
  },
  {
    name: "Woodson Hall",
    bounds: [35.786342, -78.671132, 35.786807, -78.670254],
  },
  {
    name: "Yarbrough Central Utility Plant",
    bounds: [35.784105, -78.667949, 35.784609, -78.666933],
  },
];
