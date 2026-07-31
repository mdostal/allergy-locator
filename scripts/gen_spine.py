#!/usr/bin/env python3
"""Generate the canonical US-city spine (cities.json) and the grass-dominant
allergy-severity layer (allergy-scores.json).

Spine carries NO scores. Scores keyed by the same id.
Scoring model: grass-dominant lens (ragweed/cedar/oak/elm/mold NEGATIVE, suppressed).
"""
import json, os

# ---------------------------------------------------------------------------
# City spine. Each tuple:
#   (id, city, state, lat, lon, pop, elevation_ft, koppen, coastal, flags)
# flags is an optional dict of scoring hints:
#   turf   -> extra irrigated/grass-seed-valley turf bump (int)
#   aridsw -> True: arid-SW desert chenopod/amaranth + dust layer
# lat/lon ~2dp, pop rounded, elevation approx, Koppen zone.
# ---------------------------------------------------------------------------
CITIES = [
    # --- ~150 largest US cities/metros -------------------------------------
    ("new-york-ny","New York","NY",40.71,-74.01,8300000,33,"Cfa",True,{}),
    ("los-angeles-ca","Los Angeles","CA",34.05,-118.24,3900000,285,"Csb",True,{"turf":6}),
    ("chicago-il","Chicago","IL",41.88,-87.63,2700000,594,"Dfa",True,{}),
    ("houston-tx","Houston","TX",29.76,-95.37,2300000,80,"Cfa",True,{"turf":5}),
    ("phoenix-az","Phoenix","AZ",33.45,-112.07,1600000,1086,"BWh",False,{"turf":8,"aridsw":True}),
    ("philadelphia-pa","Philadelphia","PA",39.95,-75.17,1600000,39,"Cfa",True,{}),
    ("san-antonio-tx","San Antonio","TX",29.42,-98.49,1500000,650,"Cfa",False,{"turf":5}),
    ("san-diego-ca","San Diego","CA",32.72,-117.16,1400000,62,"BSh",True,{"turf":6}),
    ("dallas-tx","Dallas","TX",32.78,-96.80,1300000,430,"Cfa",False,{"turf":6}),
    ("san-jose-ca","San Jose","CA",37.34,-121.89,1000000,82,"Csa",False,{"turf":6}),
    ("austin-tx","Austin","TX",30.27,-97.74,970000,489,"Cfa",False,{"turf":6}),
    ("jacksonville-fl","Jacksonville","FL",30.33,-81.66,950000,16,"Cfa",True,{"turf":4}),
    ("fort-worth-tx","Fort Worth","TX",32.76,-97.33,940000,653,"Cfa",False,{"turf":6}),
    ("columbus-oh","Columbus","OH",39.96,-82.99,910000,902,"Dfa",False,{}),
    ("charlotte-nc","Charlotte","NC",35.23,-80.84,880000,751,"Cfa",False,{"turf":4}),
    ("san-francisco-ca","San Francisco","CA",37.77,-122.42,870000,52,"Csb",True,{}),
    ("indianapolis-in","Indianapolis","IN",39.77,-86.16,880000,715,"Dfa",False,{}),
    ("seattle-wa","Seattle","WA",47.61,-122.33,750000,175,"Cfb",True,{"turf":6}),
    ("denver-co","Denver","CO",39.74,-104.99,720000,5280,"BSk",False,{"turf":10}),
    ("washington-dc","Washington","DC",38.91,-77.04,690000,72,"Cfa",False,{}),
    ("boston-ma","Boston","MA",42.36,-71.06,650000,141,"Dfb",True,{}),
    ("el-paso-tx","El Paso","TX",31.76,-106.49,680000,3740,"BWk",False,{"aridsw":True}),
    ("nashville-tn","Nashville","TN",36.16,-86.78,690000,597,"Cfa",False,{"turf":4}),
    ("oklahoma-city-ok","Oklahoma City","OK",35.47,-97.52,690000,1201,"Cfa",False,{"turf":6}),
    ("las-vegas-nv","Las Vegas","NV",36.17,-115.14,650000,2001,"BWh",False,{"turf":9,"aridsw":True}),
    ("detroit-mi","Detroit","MI",42.33,-83.05,630000,600,"Dfa",False,{}),
    ("portland-or","Portland","OR",45.52,-122.68,650000,50,"Csb",False,{"turf":8}),
    ("memphis-tn","Memphis","TN",35.15,-90.05,630000,337,"Cfa",False,{"turf":5}),
    ("louisville-ky","Louisville","KY",38.25,-85.76,620000,466,"Cfa",False,{"turf":4}),
    ("milwaukee-wi","Milwaukee","WI",43.04,-87.91,570000,617,"Dfb",True,{}),
    ("baltimore-md","Baltimore","MD",39.29,-76.61,580000,33,"Cfa",True,{}),
    ("albuquerque-nm","Albuquerque","NM",35.08,-106.65,560000,5312,"BSk",False,{"turf":6,"aridsw":True}),
    ("tucson-az","Tucson","AZ",32.22,-110.97,540000,2643,"BWh",False,{"turf":6,"aridsw":True}),
    ("fresno-ca","Fresno","CA",36.75,-119.77,540000,328,"BSh",False,{"turf":6}),
    ("sacramento-ca","Sacramento","CA",38.58,-121.49,520000,30,"Csa",False,{"turf":6}),
    ("mesa-az","Mesa","AZ",33.42,-111.83,510000,1243,"BWh",False,{"turf":8,"aridsw":True}),
    ("kansas-city-mo","Kansas City","MO",39.10,-94.58,510000,910,"Dfa",False,{"turf":4}),
    ("atlanta-ga","Atlanta","GA",33.75,-84.39,500000,1050,"Cfa",False,{"turf":5}),
    ("omaha-ne","Omaha","NE",41.26,-95.94,490000,1090,"Dfa",False,{"turf":4}),
    ("colorado-springs-co","Colorado Springs","CO",38.83,-104.82,480000,6035,"BSk",False,{"turf":6}),
    ("raleigh-nc","Raleigh","NC",35.78,-78.64,470000,315,"Cfa",False,{"turf":4}),
    ("long-beach-ca","Long Beach","CA",33.77,-118.19,460000,39,"Csb",True,{"turf":6}),
    ("virginia-beach-va","Virginia Beach","VA",36.85,-75.98,460000,12,"Cfa",True,{"turf":4}),
    ("miami-fl","Miami","FL",25.76,-80.19,440000,6,"Aw",True,{"turf":4}),
    ("oakland-ca","Oakland","CA",37.80,-122.27,440000,43,"Csb",True,{}),
    ("minneapolis-mn","Minneapolis","MN",44.98,-93.27,430000,830,"Dfb",False,{}),
    ("tulsa-ok","Tulsa","OK",36.15,-95.99,410000,700,"Cfa",False,{"turf":5}),
    ("bakersfield-ca","Bakersfield","CA",35.37,-119.02,400000,404,"BSh",False,{"turf":6}),
    ("wichita-ks","Wichita","KS",37.69,-97.34,400000,1299,"Cfa",False,{"turf":5}),
    ("arlington-tx","Arlington","TX",32.74,-97.11,390000,600,"Cfa",False,{"turf":6}),
    ("aurora-co","Aurora","CO",39.73,-104.83,390000,5471,"BSk",False,{"turf":10}),
    ("tampa-fl","Tampa","FL",27.95,-82.46,400000,48,"Cfa",True,{"turf":4}),
    ("new-orleans-la","New Orleans","LA",29.95,-90.07,380000,7,"Cfa",True,{"turf":4}),
    ("cleveland-oh","Cleveland","OH",41.50,-81.69,370000,653,"Dfa",True,{}),
    ("honolulu-hi","Honolulu","HI",21.31,-157.86,350000,19,"Aw",True,{}),
    ("anaheim-ca","Anaheim","CA",33.84,-117.91,350000,157,"Csb",True,{"turf":6}),
    ("lexington-ky","Lexington","KY",38.04,-84.50,320000,978,"Cfa",False,{"turf":6}),
    ("stockton-ca","Stockton","CA",37.96,-121.29,320000,13,"Csa",False,{"turf":6}),
    ("corpus-christi-tx","Corpus Christi","TX",27.80,-97.40,320000,7,"BSh",True,{"turf":4}),
    ("henderson-nv","Henderson","NV",36.04,-114.98,320000,1867,"BWh",False,{"turf":9,"aridsw":True}),
    ("riverside-ca","Riverside","CA",33.95,-117.40,320000,860,"BSh",False,{"turf":7}),
    ("newark-nj","Newark","NJ",40.74,-74.17,310000,20,"Cfa",True,{}),
    ("saint-paul-mn","Saint Paul","MN",44.95,-93.09,310000,764,"Dfb",False,{}),
    ("santa-ana-ca","Santa Ana","CA",33.75,-117.87,310000,110,"Csb",True,{"turf":6}),
    ("cincinnati-oh","Cincinnati","OH",39.10,-84.51,310000,482,"Dfa",False,{}),
    ("irvine-ca","Irvine","CA",33.68,-117.83,310000,56,"Csb",True,{"turf":6}),
    ("orlando-fl","Orlando","FL",28.54,-81.38,310000,82,"Cfa",False,{"turf":5}),
    ("pittsburgh-pa","Pittsburgh","PA",40.44,-79.996,300000,1223,"Dfb",False,{}),
    ("st-louis-mo","St. Louis","MO",38.63,-90.20,300000,466,"Dfa",False,{}),
    ("greensboro-nc","Greensboro","NC",36.07,-79.79,300000,896,"Cfa",False,{"turf":4}),
    ("jersey-city-nj","Jersey City","NJ",40.73,-74.08,290000,20,"Cfa",True,{}),
    ("anchorage-ak","Anchorage","AK",61.22,-149.90,290000,102,"Dfc",True,{}),
    ("lincoln-ne","Lincoln","NE",40.81,-96.70,290000,1176,"Dfa",False,{"turf":4}),
    ("plano-tx","Plano","TX",33.02,-96.70,290000,700,"Cfa",False,{"turf":6}),
    ("durham-nc","Durham","NC",35.99,-78.90,290000,404,"Cfa",False,{"turf":4}),
    ("buffalo-ny","Buffalo","NY",42.89,-78.88,280000,600,"Dfb",True,{}),
    ("chandler-az","Chandler","AZ",33.31,-111.84,280000,1213,"BWh",False,{"turf":8,"aridsw":True}),
    ("chula-vista-ca","Chula Vista","CA",32.64,-117.08,280000,69,"BSh",True,{"turf":6}),
    ("toledo-oh","Toledo","OH",41.66,-83.56,270000,614,"Dfa",False,{}),
    ("madison-wi","Madison","WI",43.07,-89.40,270000,873,"Dfb",False,{}),
    ("gilbert-az","Gilbert","AZ",33.35,-111.79,270000,1024,"BWh",False,{"turf":8,"aridsw":True}),
    ("reno-nv","Reno","NV",39.53,-119.81,270000,4505,"BSk",False,{"turf":7,"aridsw":True}),
    ("fort-wayne-in","Fort Wayne","IN",41.08,-85.14,270000,810,"Dfa",False,{}),
    ("north-las-vegas-nv","North Las Vegas","NV",36.20,-115.12,270000,2024,"BWh",False,{"turf":9,"aridsw":True}),
    ("st-petersburg-fl","St. Petersburg","FL",27.77,-82.64,260000,44,"Cfa",True,{"turf":4}),
    ("lubbock-tx","Lubbock","TX",33.58,-101.86,260000,3202,"BSk",False,{"turf":5,"aridsw":True}),
    ("irving-tx","Irving","TX",32.81,-96.95,260000,463,"Cfa",False,{"turf":6}),
    ("laredo-tx","Laredo","TX",27.51,-99.51,260000,438,"BSh",False,{"turf":4,"aridsw":True}),
    ("winston-salem-nc","Winston-Salem","NC",36.10,-80.24,250000,912,"Cfa",False,{"turf":4}),
    ("chesapeake-va","Chesapeake","VA",36.77,-76.29,250000,12,"Cfa",True,{"turf":4}),
    ("glendale-az","Glendale","AZ",33.54,-112.19,250000,1155,"BWh",False,{"turf":8,"aridsw":True}),
    ("scottsdale-az","Scottsdale","AZ",33.49,-111.93,240000,1257,"BWh",False,{"turf":8,"aridsw":True}),
    ("norfolk-va","Norfolk","VA",36.85,-76.29,240000,7,"Cfa",True,{"turf":4}),
    ("fremont-ca","Fremont","CA",37.55,-121.99,230000,56,"Csb",True,{"turf":6}),
    ("garland-tx","Garland","TX",32.91,-96.64,240000,563,"Cfa",False,{"turf":6}),
    ("hialeah-fl","Hialeah","FL",25.86,-80.28,220000,10,"Aw",True,{"turf":4}),
    ("richmond-va","Richmond","VA",37.54,-77.44,230000,167,"Cfa",False,{"turf":4}),
    ("spokane-wa","Spokane","WA",47.66,-117.43,230000,1843,"BSk",False,{"turf":6}),
    ("baton-rouge-la","Baton Rouge","LA",30.45,-91.19,220000,56,"Cfa",False,{"turf":4}),
    ("tacoma-wa","Tacoma","WA",47.25,-122.44,220000,243,"Cfb",True,{"turf":6}),
    ("san-bernardino-ca","San Bernardino","CA",34.11,-117.29,220000,1053,"BSh",False,{"turf":7}),
    ("modesto-ca","Modesto","CA",37.64,-120.997,220000,88,"Csa",False,{"turf":6}),
    ("fontana-ca","Fontana","CA",34.09,-117.44,210000,1237,"BSh",False,{"turf":7}),
    ("des-moines-ia","Des Moines","IA",41.59,-93.62,210000,955,"Dfa",False,{"turf":4}),
    ("moreno-valley-ca","Moreno Valley","CA",33.94,-117.23,210000,1631,"BSh",False,{"turf":7}),
    ("santa-clarita-ca","Santa Clarita","CA",34.39,-118.54,230000,1207,"Csa",False,{"turf":7}),
    ("fayetteville-nc","Fayetteville","NC",35.05,-78.88,210000,95,"Cfa",False,{"turf":4}),
    ("birmingham-al","Birmingham","AL",33.52,-86.81,200000,644,"Cfa",False,{"turf":5}),
    ("oxnard-ca","Oxnard","CA",34.20,-119.18,200000,52,"Csb",True,{"turf":6}),
    ("rochester-ny","Rochester","NY",43.16,-77.61,210000,505,"Dfb",True,{}),
    ("port-st-lucie-fl","Port St. Lucie","FL",27.27,-80.36,230000,23,"Cfa",True,{"turf":4}),
    ("grand-rapids-mi","Grand Rapids","MI",42.96,-85.67,200000,610,"Dfb",False,{}),
    ("huntsville-al","Huntsville","AL",34.73,-86.59,220000,600,"Cfa",False,{"turf":5}),
    ("salt-lake-city-ut","Salt Lake City","UT",40.76,-111.89,200000,4226,"BSk",False,{"turf":7,"aridsw":True}),
    ("frisco-tx","Frisco","TX",33.15,-96.82,220000,700,"Cfa",False,{"turf":6}),
    ("yonkers-ny","Yonkers","NY",40.93,-73.90,210000,52,"Cfa",True,{}),
    ("amarillo-tx","Amarillo","TX",35.22,-101.83,200000,3606,"BSk",False,{"turf":5,"aridsw":True}),
    ("glendale-ca","Glendale","CA",34.14,-118.26,200000,522,"Csa",False,{"turf":6}),
    ("huntington-beach-ca","Huntington Beach","CA",33.66,-117.999,200000,36,"Csb",True,{"turf":6}),
    ("mckinney-tx","McKinney","TX",33.20,-96.64,200000,600,"Cfa",False,{"turf":6}),
    ("montgomery-al","Montgomery","AL",32.37,-86.30,200000,220,"Cfa",False,{"turf":5}),
    ("augusta-ga","Augusta","GA",33.47,-81.97,200000,143,"Cfa",False,{"turf":4}),
    ("aurora-il","Aurora","IL",41.76,-88.32,180000,682,"Dfa",False,{}),
    ("akron-oh","Akron","OH",41.08,-81.52,190000,1004,"Dfa",False,{}),
    ("little-rock-ar","Little Rock","AR",34.75,-92.29,200000,335,"Cfa",False,{"turf":5}),
    ("tempe-az","Tempe","AZ",33.43,-111.94,180000,1140,"BWh",False,{"turf":8,"aridsw":True}),
    ("columbus-ga","Columbus","GA",32.46,-84.99,200000,243,"Cfa",False,{"turf":4}),
    ("overland-park-ks","Overland Park","KS",38.98,-94.67,200000,1030,"Dfa",False,{"turf":4}),
    ("grand-prairie-tx","Grand Prairie","TX",32.75,-97.00,200000,560,"Cfa",False,{"turf":6}),
    ("tallahassee-fl","Tallahassee","FL",30.44,-84.28,200000,203,"Cfa",False,{"turf":4}),
    ("cape-coral-fl","Cape Coral","FL",26.56,-81.95,200000,10,"Aw",True,{"turf":4}),
    ("mobile-al","Mobile","AL",30.69,-88.04,180000,10,"Cfa",True,{"turf":4}),
    ("knoxville-tn","Knoxville","TN",35.96,-83.92,190000,886,"Cfa",False,{"turf":4}),
    ("shreveport-la","Shreveport","LA",32.53,-93.75,180000,180,"Cfa",False,{"turf":4}),
    ("worcester-ma","Worcester","MA",42.26,-71.80,210000,480,"Dfb",False,{}),
    ("ontario-ca","Ontario","CA",34.07,-117.65,180000,988,"BSh",False,{"turf":7}),
    ("vancouver-wa","Vancouver","WA",45.63,-122.66,190000,164,"Csb",False,{"turf":8}),
    ("sioux-falls-sd","Sioux Falls","SD",43.55,-96.70,200000,1442,"Dfa",False,{"turf":4}),
    ("chattanooga-tn","Chattanooga","TN",35.05,-85.31,180000,680,"Cfa",False,{"turf":4}),
    ("brownsville-tx","Brownsville","TX",25.90,-97.50,190000,33,"BSh",True,{"turf":4,"aridsw":True}),
    ("fort-lauderdale-fl","Fort Lauderdale","FL",26.12,-80.14,180000,9,"Aw",True,{"turf":4}),
    ("providence-ri","Providence","RI",41.82,-71.41,190000,79,"Dfb",True,{}),
    ("newport-news-va","Newport News","VA",37.09,-76.52,180000,25,"Cfa",True,{"turf":4}),
    ("rancho-cucamonga-ca","Rancho Cucamonga","CA",34.11,-117.59,180000,1200,"BSh",False,{"turf":7}),
    ("santa-rosa-ca","Santa Rosa","CA",38.44,-122.71,180000,164,"Csb",False,{"turf":7}),
    ("peoria-az","Peoria","AZ",33.58,-112.24,190000,1150,"BWh",False,{"turf":8,"aridsw":True}),
    ("oceanside-ca","Oceanside","CA",33.20,-117.38,170000,30,"Csb",True,{"turf":6}),
    ("elk-grove-ca","Elk Grove","CA",38.41,-121.37,180000,46,"Csa",False,{"turf":6}),
    ("salem-or","Salem","OR",44.94,-123.04,180000,154,"Csb",False,{"turf":9}),
    ("grand-junction-co","Grand Junction","CO",39.06,-108.55,66000,4583,"BSk",False,{"turf":7,"aridsw":True}),

    # --- required candidate / personal towns --------------------------------
    ("sundance-wy","Sundance","WY",44.41,-104.38,1200,4750,"Dfb",False,{}),
    ("rapid-city-sd","Rapid City","SD",44.08,-103.23,78000,3202,"BSk",False,{"turf":5}),
    ("blanding-ut","Blanding","UT",37.62,-109.48,3600,6060,"BSk",False,{"aridsw":True}),
    ("monticello-ut","Monticello","UT",37.87,-109.34,2000,7070,"BSk",False,{"aridsw":True}),
    ("durango-co","Durango","CO",37.28,-107.88,19000,6512,"Dfb",False,{"turf":4}),
    ("flagstaff-az","Flagstaff","AZ",35.20,-111.65,76000,6909,"Dsb",False,{}),
    ("taos-nm","Taos","NM",36.41,-105.57,6500,6969,"BSk",False,{"aridsw":True}),
    ("santa-fe-nm","Santa Fe","NM",35.69,-105.94,88000,7199,"BSk",False,{"turf":5,"aridsw":True}),
    ("los-alamos-nm","Los Alamos","NM",35.88,-106.30,13000,7320,"Dsb",False,{}),
    ("geraldine-mt","Geraldine","MT",47.60,-110.26,260,3055,"BSk",False,{}),
    ("billings-mt","Billings","MT",45.79,-108.50,120000,3123,"BSk",False,{"turf":5}),
    ("kalispell-mt","Kalispell","MT",48.20,-114.31,28000,2956,"Dfb",False,{"turf":4}),
    ("whitewright-tx","Whitewright","TX",33.51,-96.39,1800,679,"Cfa",False,{"turf":5}),
    ("sandpoint-id","Sandpoint","ID",48.28,-116.55,9000,2100,"Dfb",False,{"turf":4}),
    ("asheville-nc","Asheville","NC",35.60,-82.55,95000,2134,"Cfb",False,{"turf":4}),
    ("boise-id","Boise","ID",43.62,-116.20,240000,2704,"BSk",False,{"turf":22,"aridsw":True}),
    ("yuma-az","Yuma","AZ",32.69,-114.63,100000,138,"BWh",False,{"turf":6,"aridsw":True}),
    ("carlsbad-nm","Carlsbad","NM",32.42,-104.23,32000,3120,"BWk",False,{"turf":4,"aridsw":True}),
]


# ---------------------------------------------------------------------------
# Scoring model (grass-dominant lens) — recalibrated against ground-truth anchors
# ---------------------------------------------------------------------------
# Score = base_season_climate + turf_boost + arid_weed + elevation_discount
#         + coastal_nudge, then a gentle top compression (>92) to avoid a ceiling
#         pileup. Fitted to a real grass-dominant person's validated reactions.
# Two variants are scored against the anchors; the better-fitting one ships.
#   A = moderate turf boost   B = heavy turf + grass-seed-valley boost (SHIPPED)
# ---------------------------------------------------------------------------

# Irrigated / grass-seed agricultural valleys: cultivated turf + grass-seed
# farming keep grass pollen high regardless of the dry-climate zone. Membership
# gets a big additive "seed-valley floor"; the per-city turf flag then sets the
# within-valley gradient (Boise's grass-seed farms >> urban SLC lawns).
SEED_VALLEY = {
    "boise-id", "salt-lake-city-ut", "colorado-springs-co", "denver-co", "aurora-co",
    "salem-or", "portland-or", "vancouver-wa", "spokane-wa", "reno-nv", "albuquerque-nm",
    "sacramento-ca", "fresno-ca", "bakersfield-ca", "stockton-ca", "modesto-ca", "elk-grove-ca",
}

# Weighting variants. B is the shipped model (best fit to the ground truth).
VARIANTS = {
    "A": dict(turf_mult=1.05, seed_bonus=14, arid_w=12, coastal_w=4, irrig_supp=0.5),
    "B": dict(turf_mult=1.82, seed_bonus=41, arid_w=19, coastal_w=4, irrig_supp=0.9),
}
SHIP = "B"

# Ground-truth anchors: a real grass-dominant person's validated 0-100 reactions.
# (Honolulu is directional-only — coastal beach moderation — not a hard anchor.)
ANCHORS = {
    "flagstaff-az": 8, "sundance-wy": 8, "rapid-city-sd": 8, "durango-co": 13,
    "omaha-ne": 25, "kalispell-mt": 30, "san-jose-ca": 50, "fremont-ca": 50,
    "salt-lake-city-ut": 58, "washington-dc": 60, "colorado-springs-co": 60,
    "austin-tx": 78, "carlsbad-nm": 78, "whitewright-tx": 80, "yuma-az": 82,
    "phoenix-az": 83, "mesa-az": 83, "boise-id": 88, "orlando-fl": 92, "cape-coral-fl": 92,
}

def base_from_climate(k, lat):
    """base_season_climate = grass-pollen SEASON LENGTH x climate load."""
    if k in ("Af", "Am", "Aw"):       # tropical/subtropical: year-round grass, no reset
        return 91
    if k == "Cfa":                     # humid subtropical: season length scales inverse to lat
        return round(85 - (lat - 28) * 2.2)
    if k == "Cfb":                     # marine west coast
        return 46
    if k == "Csa":                     # hot-summer Mediterranean (CA valleys)
        return 40
    if k == "Csb":                     # warm-summer Mediterranean (coastal CA / PNW)
        return 44
    if k == "Dfa":                     # hot-summer humid continental: hard cold reset
        return 18
    if k == "Dfb":                     # warm-summer humid continental: short season
        return 25
    if k == "Dfc":                     # subarctic
        return 12
    if k in ("Dsb", "Dsc"):            # dry-summer highland
        return 24
    if k == "BSh":                     # hot semi-arid
        return 44
    if k == "BSk":                     # cold semi-arid steppe (LOW; turf/seed does the lifting)
        return 7
    if k == "BWh":                     # hot desert (irrigated Bermuda/rye lawns run hot)
        return 51
    if k == "BWk":                     # cold desert
        return 57
    return 38

def elevation_raw(elev):
    """Dry high elevation shortens/weakens the grass season (negative)."""
    if elev > 6500: return -20
    if elev > 5500: return -15
    if elev > 4500: return -12
    if elev > 3500: return -7
    if elev > 2500: return -3
    if elev > 1800: return -1
    return 0

def compress(x):
    """Gently tame runaways above the anchored ceiling so the worst tier spreads
    (89-97) instead of pancaking at the cap. Affects only top grass-seed valleys."""
    return x if x <= 92 else 92 + (x - 92) * 0.4

def score_components(c, P):
    """Return the fully decomposed score for city dict c under weight set P."""
    k = c["koppen"]; lat = c["lat"]; elev = c["elevation_ft"]
    coastal = c["coastal"]; flags = c["flags"]; cid = c["id"]
    tf = flags.get("turf", 0)

    base = base_from_climate(k, lat)

    # turf_boost = per-city cultivated/irrigated turf gradient + seed-valley floor
    turf = min(tf, 24) * P["turf_mult"]
    seed = P["seed_bonus"] if cid in SEED_VALLEY else 0
    turf_boost = round(turf + seed)

    # arid-SW desert chenopod/amaranth weed + dust load. Mutually exclusive with
    # the seed-valley floor (an irrigated valley isn't the wind-blown dust scenario).
    arid = P["arid_w"] if (flags.get("aridsw") and cid not in SEED_VALLEY) else 0

    # irrigation (seed valley OR dense turf) defeats the dry-high season shortening
    irrig = 1.0 if (cid in SEED_VALLEY or tf >= 8) else 0.0
    elevation_discount = round(elevation_raw(elev) * (1 - P["irrig_supp"] * irrig))

    coastal_nudge = -P["coastal_w"] if coastal else 0

    raw = base + turf_boost + arid + elevation_discount + coastal_nudge
    score = max(2, min(97, round(compress(raw))))
    return {
        "base_season_climate": base,
        "turf_boost": turf_boost,
        "arid_weed": arid,
        "elevation_discount": elevation_discount,
        "coastal_nudge": coastal_nudge,
        "score": score,
    }

def tier_of(s):
    if s < 15:  return "near-zero"
    if s < 35:  return "low"
    if s < 65:  return "moderate"
    if s <= 88: return "high"
    return "worst"

def why_of(c, comp):
    """Plain-language driver, derived from the dominant component."""
    k = c["koppen"]; elev = c["elevation_ft"]; flags = c["flags"]; cid = c["id"]
    coastal = c["coastal"]; s = comp["score"]
    if cid in SEED_VALLEY and comp["turf_boost"] >= 45:
        return "irrigated grass-seed valley — cultivated turf drives grass pollen high"
    if k in ("Af", "Am", "Aw"):
        return "year-round subtropical grass, no winter reset"
    if k == "Cfa" and s >= 65:
        return "long warm-humid grass season, no winter reset"
    if comp["arid_weed"] and s >= 55:
        return "hot desert — irrigated lawns plus arid weed/dust load"
    if comp["elevation_discount"] <= -8 and s < 20:
        return "high dry elevation, very short grass season"
    if k in ("Dfb", "Dfc") and s < 35:
        return "hard cold-winter reset, short grass season"
    if k in ("Dfa",) and s < 35:
        return "hot grassy summer tempered by hard winter reset"
    if comp["arid_weed"]:
        return "light grass but arid desert weed/dust load"
    if coastal and s < 60:
        return "ocean-moderated coastal grass season"
    if k == "Cfa":
        return "moderate humid-subtropical grass season"
    return "moderate mixed grass exposure"

def mae(variant):
    P = VARIANTS[variant]
    errs = []
    for cid, tgt in ANCHORS.items():
        c = CITY_BY_ID[cid]
        errs.append(abs(score_components(c, P)["score"] - tgt))
    return sum(errs) / len(errs)

# ---------------------------------------------------------------------------
# Emit
# ---------------------------------------------------------------------------
CITY_BY_ID = {}
spine = []
seen = set()
for (cid, city, st, lat, lon, pop, elev, k, coastal, flags) in CITIES:
    assert cid not in seen, f"dup id {cid}"
    seen.add(cid)
    rec = {"id": cid, "city": city, "state": st, "lat": lat, "lon": lon,
           "pop": pop, "elevation_ft": elev, "koppen": k, "coastal": coastal}
    spine.append(rec)
    CITY_BY_ID[cid] = {**rec, "flags": flags}

# ---- A/B comparison against the ground-truth anchors ----
mae_a, mae_b = mae("A"), mae("B")
ship = "A" if mae_a < mae_b else "B"
assert ship == SHIP, f"expected {SHIP} to win, got {ship}"
P = VARIANTS[SHIP]

scores = []
for rec in spine:
    c = CITY_BY_ID[rec["id"]]
    comp = score_components(c, P)
    scores.append({
        "id": rec["id"],
        "base_season_climate": comp["base_season_climate"],
        "turf_boost": comp["turf_boost"],
        "arid_weed": comp["arid_weed"],
        "elevation_discount": comp["elevation_discount"],
        "coastal_nudge": comp["coastal_nudge"],
        "score": comp["score"],
        "tier": tier_of(comp["score"]),
        "why": why_of(c, comp),
    })

here = "/Users/mdostal/Code/allergy-locator/data"
with open(os.path.join(here, "cities.json"), "w") as f:
    json.dump(spine, f, indent=2)
    f.write("\n")
with open(os.path.join(here, "allergy-scores.json"), "w") as f:
    json.dump(scores, f, indent=2)
    f.write("\n")

# ---- report ----
byscore = sorted(scores, key=lambda r: r["score"])
name = {c[0]: f"{c[1]}, {c[2]}" for c in CITIES}
print(f"TOTAL cities: {len(spine)}")
print(f"A/B fit  ->  MAE(A moderate-turf) = {mae_a:.2f}   MAE(B heavy-turf+seed-valley) = {mae_b:.2f}")
print(f"SHIPPED variant: {SHIP} (lower MAE)")
from collections import Counter
print("Tier counts:", dict(Counter(r["tier"] for r in scores)))
print("\n8 LOWEST (best):")
for r in byscore[:8]:
    print(f"  {r['score']:>2}  {r['tier']:<9} {name[r['id']]}")
print("\n8 HIGHEST (worst):")
for r in byscore[-8:][::-1]:
    print(f"  {r['score']:>2}  {r['tier']:<9} {name[r['id']]}")
sid = {r["id"]: r["score"] for r in scores}
print("\nGround-truth check:")
for cid in ("boise-id", "colorado-springs-co", "salt-lake-city-ut"):
    print(f"  {name[cid]:24} score {sid[cid]:>2}  (target {ANCHORS[cid]})")
