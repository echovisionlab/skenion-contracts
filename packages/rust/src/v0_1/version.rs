pub const CONTRACTS_PACKAGE_VERSION: &str = env!("CARGO_PKG_VERSION");
include!(concat!(env!("OUT_DIR"), "/version_constants.rs"));

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct ParsedVersion {
    major: u64,
    minor: u64,
    patch: u64,
}

fn parse_semver(version: &str) -> Option<ParsedVersion> {
    let parts: Vec<&str> = version.split('.').collect();
    if parts.len() != 3 {
        return None;
    }
    let major = parse_semver_part(parts[0])?;
    let minor = parse_semver_part(parts[1])?;
    let patch = parse_semver_part(parts[2])?;
    Some(ParsedVersion {
        major,
        minor,
        patch,
    })
}

fn parse_semver_part(part: &str) -> Option<u64> {
    if part.is_empty() || !part.bytes().all(|byte| byte.is_ascii_digit()) {
        return None;
    }
    if part.len() > 1 && part.starts_with('0') {
        return None;
    }
    part.parse().ok()
}

pub fn derive_v0_compatibility_line(version: &str) -> Option<String> {
    let parsed = parse_semver(version)?;
    if parsed.major != 0 {
        return None;
    }
    Some(format!("0.{}", parsed.minor))
}

pub fn derive_v0_compatibility_range(version: &str) -> Option<String> {
    let parsed = parse_semver(version)?;
    if parsed.major != 0 {
        return None;
    }
    Some(format!(">=0.{}.0 <0.{}.0", parsed.minor, parsed.minor + 1))
}

pub fn is_same_v0_compatibility_line(left_version: &str, right_version: &str) -> bool {
    derive_v0_compatibility_line(left_version) == derive_v0_compatibility_line(right_version)
        && derive_v0_compatibility_line(left_version).is_some()
}

pub fn satisfies_v0_compatibility_range(version: &str, range: &str) -> bool {
    let Some(version) = parse_semver(version) else {
        return false;
    };
    if version.major != 0 {
        return false;
    }

    let parts: Vec<&str> = range.split(' ').collect();
    if parts.len() != 2 {
        return false;
    }
    let Some(lower) = parts[0].strip_prefix(">=") else {
        return false;
    };
    let Some(upper) = parts[1].strip_prefix('<') else {
        return false;
    };
    let Some(lower) = parse_semver(lower) else {
        return false;
    };
    let Some(upper) = parse_semver(upper) else {
        return false;
    };

    lower.major == 0
        && upper.major == 0
        && lower.patch == 0
        && upper.patch == 0
        && upper.minor == lower.minor + 1
        && version.minor == lower.minor
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn derives_v0_lines_and_ranges() {
        assert_eq!(
            derive_v0_compatibility_line("0.44.0").as_deref(),
            Some("0.44")
        );
        assert_eq!(
            derive_v0_compatibility_range("0.44.33").as_deref(),
            Some(">=0.44.0 <0.45.0")
        );
        assert!(is_same_v0_compatibility_line("0.44.0", "0.44.33"));
        assert!(!is_same_v0_compatibility_line("0.44.33", "0.45.0"));
        assert!(satisfies_v0_compatibility_range(
            "0.44.33",
            ">=0.44.0 <0.45.0"
        ));
        assert!(!satisfies_v0_compatibility_range(
            "0.45.0",
            ">=0.44.0 <0.45.0"
        ));
    }

    #[test]
    fn derives_package_line_and_range_from_current_version() {
        let package_minor = CONTRACTS_PACKAGE_VERSION
            .split('.')
            .nth(1)
            .expect("package version should have a minor component")
            .parse::<u64>()
            .expect("package minor should be numeric");
        let same_line_patch = format!("0.{}.99", package_minor);
        let next_line_version = format!("0.{}.0", package_minor + 1);

        assert_eq!(
            derive_v0_compatibility_line(CONTRACTS_PACKAGE_VERSION).as_deref(),
            Some(CONTRACTS_COMPATIBILITY_LINE)
        );
        assert_eq!(
            derive_v0_compatibility_range(CONTRACTS_PACKAGE_VERSION).as_deref(),
            Some(CONTRACTS_COMPATIBILITY_RANGE)
        );
        assert!(is_same_v0_compatibility_line(
            CONTRACTS_PACKAGE_VERSION,
            &same_line_patch
        ));
        assert!(!is_same_v0_compatibility_line(
            CONTRACTS_PACKAGE_VERSION,
            &next_line_version
        ));
        assert!(satisfies_v0_compatibility_range(
            CONTRACTS_PACKAGE_VERSION,
            CONTRACTS_COMPATIBILITY_RANGE
        ));
        assert!(!satisfies_v0_compatibility_range(
            &next_line_version,
            CONTRACTS_COMPATIBILITY_RANGE
        ));
    }

    #[test]
    fn rejects_invalid_semver_inputs() {
        assert_eq!(derive_v0_compatibility_line("0.44"), None);
        assert_eq!(derive_v0_compatibility_line("0.x.0"), None);
        assert_eq!(derive_v0_compatibility_line("0.044.0"), None);
        assert_eq!(derive_v0_compatibility_line("1.0.0"), None);
        assert_eq!(derive_v0_compatibility_range("1.0.0"), None);
        assert!(!is_same_v0_compatibility_line("not-semver", "not-semver"));
    }

    #[test]
    fn rejects_invalid_v0_range_inputs() {
        assert!(!satisfies_v0_compatibility_range(
            "not-semver",
            ">=0.44.0 <0.45.0"
        ));
        assert!(!satisfies_v0_compatibility_range(
            "1.0.0",
            ">=0.44.0 <0.45.0"
        ));
        assert!(!satisfies_v0_compatibility_range("0.44.0", ">=0.44.0"));
        assert!(!satisfies_v0_compatibility_range(
            "0.44.0",
            ">0.44.0 <0.45.0"
        ));
        assert!(!satisfies_v0_compatibility_range(
            "0.44.0",
            ">=0.44.0 0.45.0"
        ));
        assert!(!satisfies_v0_compatibility_range("0.44.0", ">=bad <0.45.0"));
        assert!(!satisfies_v0_compatibility_range("0.44.0", ">=0.44.0 <bad"));
        assert!(!satisfies_v0_compatibility_range(
            "0.44.0",
            ">=1.44.0 <1.45.0"
        ));
        assert!(!satisfies_v0_compatibility_range(
            "0.44.0",
            ">=0.44.1 <0.45.0"
        ));
        assert!(!satisfies_v0_compatibility_range(
            "0.44.0",
            ">=0.44.0 <0.45.1"
        ));
        assert!(!satisfies_v0_compatibility_range(
            "0.44.0",
            ">=0.44.0 <0.46.0"
        ));
    }
}
