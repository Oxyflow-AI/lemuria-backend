#!/usr/bin/env python3
"""
Kerykeion-based Vedic Astrology Calculator
Designed to be called from Node.js with command line arguments
"""

import sys
import json
from datetime import datetime
import pytz
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder

try:
    from kerykeion import AstrologicalSubject
except ImportError:
    print(json.dumps({"error": "Kerykeion library not installed. Please install: pip install kerykeion"}))
    sys.exit(1)

def get_geolocation(city, country):
    """Fetch latitude and longitude using geopy."""
    try:
        geolocator = Nominatim(user_agent="vedic_astrology_calculator")
        location = geolocator.geocode(f"{city}, {country}")
        if location:
            return location.latitude, location.longitude
        else:
            raise ValueError(f"Could not find coordinates for {city}, {country}")
    except Exception as e:
        raise ValueError(f"Geolocation error: {str(e)}")

def get_timezone(lat, lon):
    """Determine timezone using timezonefinder."""
    try:
        tf = TimezoneFinder()
        tz_str = tf.timezone_at(lat=lat, lng=lon)
        if tz_str is None:
            # Fallback for Indian coordinates
            if 6 <= lat <= 37 and 68 <= lon <= 97:
                return 'Asia/Kolkata'
            raise ValueError("Could not determine timezone for the given coordinates")
        return tz_str
    except Exception as e:
        # Fallback for Indian coordinates
        if 6 <= lat <= 37 and 68 <= lon <= 97:
            return 'Asia/Kolkata'
        raise ValueError(f"Timezone error: {str(e)}")

def get_nakshatra(moon_longitude):
    """Calculate Nakshatra based on Moon's longitude."""
    nakshatras = [
        "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
        "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
        "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
        "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
        "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
    ]
    degrees_per_nakshatra = 360 / 27  # 13.333 degrees
    nakshatra_index = int(moon_longitude // degrees_per_nakshatra)
    return nakshatras[nakshatra_index % 27]

def vedic_sign_mapping(kerykeion_sign):
    """Map Kerykeion sign names to Vedic sign names."""
    sign_map = {
        "Ari": "Mesha",
        "Tau": "Vrishabha", 
        "Gem": "Mithuna",
        "Can": "Kataka",
        "Leo": "Simha",
        "Vir": "Kanya",
        "Lib": "Tula",
        "Sco": "Vrischika",
        "Sag": "Dhanu",
        "Cap": "Makara",
        "Aqu": "Kumbha",
        "Pis": "Meena"
    }
    return sign_map.get(kerykeion_sign, kerykeion_sign)

def western_sign_mapping(kerykeion_sign):
    """Map Kerykeion sign names to Western sign names."""
    sign_map = {
        "Ari": "Aries",
        "Tau": "Taurus", 
        "Gem": "Gemini",
        "Can": "Cancer",
        "Leo": "Leo",
        "Vir": "Virgo",
        "Lib": "Libra",
        "Sco": "Scorpio",
        "Sag": "Sagittarius",
        "Cap": "Capricorn",
        "Aqu": "Aquarius",
        "Pis": "Pisces"
    }
    return sign_map.get(kerykeion_sign, kerykeion_sign)

def calculate_astrology(name, date_str, time_str, place, system="VEDIC"):
    """Calculate astrological details using Kerykeion for both Vedic and Western systems."""
    try:
        # Parse place (assume format: "City, Country")
        place_parts = place.split(',')
        if len(place_parts) >= 2:
            city = place_parts[0].strip()
            country = place_parts[1].strip()
        else:
            city = place.strip()
            country = "India"  # Default
        
        # Fetch latitude and longitude
        lat, lon = get_geolocation(city, country)
        
        # Get timezone
        tz_str = get_timezone(lat, lon)
        timezone = pytz.timezone(tz_str)
        
        # Parse date and time
        year, month, day = map(int, date_str.split('-'))
        hour, minute = map(int, time_str.split(':'))
        
        # Create local datetime
        local_dt = datetime(year, month, day, hour, minute)
        local_dt = timezone.localize(local_dt)
        
        # Convert to UTC for Kerykeion
        utc_dt = local_dt.astimezone(pytz.UTC)
        
        # Create AstrologicalSubject based on system
        if system.upper() == "VEDIC":
            subject = AstrologicalSubject(
                name=name,
                year=utc_dt.year,
                month=utc_dt.month,
                day=utc_dt.day,
                hour=utc_dt.hour,
                minute=utc_dt.minute,
                lng=lon,
                lat=lat,
                tz_str="UTC",
                zodiac_type="Sidereal",
                sidereal_mode="LAHIRI"
            )
        else:  # WESTERN
            subject = AstrologicalSubject(
                name=name,
                year=utc_dt.year,
                month=utc_dt.month,
                day=utc_dt.day,
                hour=utc_dt.hour,
                minute=utc_dt.minute,
                lng=lon,
                lat=lat,
                tz_str="UTC",
                zodiac_type="Tropic"
            )
        
        # Extract raw signs
        moon_sign_raw = subject.moon["sign"]
        sun_sign_raw = subject.sun["sign"]
        ascendant_sign_raw = subject.first_house["sign"]
        
        # Get longitudes
        moon_longitude = subject.moon["abs_pos"]
        sun_longitude = subject.sun["abs_pos"]
        ascendant_longitude = subject.first_house["abs_pos"]
        
        if system.upper() == "VEDIC":
            # Vedic calculations
            rasi = vedic_sign_mapping(moon_sign_raw)
            nakshatra = get_nakshatra(moon_longitude)
            lagna = vedic_sign_mapping(ascendant_sign_raw)
            sun_sign = vedic_sign_mapping(sun_sign_raw)
            
            return {
                "success": True,
                "system": "VEDIC",
                "rasi": rasi,
                "nakshatra": nakshatra,
                "lagna": lagna,
                "sunSign": sun_sign,
                "moonLongitude": moon_longitude,
                "ascendantLongitude": ascendant_longitude,
                "sunLongitude": sun_longitude,
                "coordinates": {
                    "latitude": lat,
                    "longitude": lon,
                    "timezone": tz_str
                },
                "raw_data": {
                    "moon_sign": moon_sign_raw,
                    "sun_sign": sun_sign_raw,
                    "ascendant_sign": ascendant_sign_raw
                }
            }
        else:  # WESTERN
            # Western calculations
            sun_sign = western_sign_mapping(sun_sign_raw)
            moon_sign = western_sign_mapping(moon_sign_raw)
            ascendant = western_sign_mapping(ascendant_sign_raw)
            
            return {
                "success": True,
                "system": "WESTERN",
                "sunSign": sun_sign,
                "moonSign": moon_sign,
                "ascendant": ascendant,
                "moonLongitude": moon_longitude,
                "ascendantLongitude": ascendant_longitude,
                "sunLongitude": sun_longitude,
                "coordinates": {
                    "latitude": lat,
                    "longitude": lon,
                    "timezone": tz_str
                },
                "raw_data": {
                    "moon_sign": moon_sign_raw,
                    "sun_sign": sun_sign_raw,
                    "ascendant_sign": ascendant_sign_raw
                }
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def main():
    """Main function to process command line arguments."""
    if len(sys.argv) < 5 or len(sys.argv) > 6:
        print(json.dumps({
            "success": False,
            "error": "Usage: python kerykeion_calculator.py <name> <date> <time> <place> [system]"
        }))
        sys.exit(1)
    
    name = sys.argv[1]
    date_str = sys.argv[2]  # Format: YYYY-MM-DD
    time_str = sys.argv[3]  # Format: HH:MM
    place = sys.argv[4]     # Format: "City, Country"
    system = sys.argv[5] if len(sys.argv) == 6 else "VEDIC"  # Default to VEDIC
    
    result = calculate_astrology(name, date_str, time_str, place, system)
    print(json.dumps(result))

if __name__ == "__main__":
    main()