pub const CONTRACTS_PACKAGE_VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct ParsedVersion {
    major: u64,
    minor: u64,
    patch: u64,
}

fn parse_semver(version: &str) -> Option<ParsedVersion> {
    let without_build = match version.split_once('+') {
        Some((without_build, build)) if is_semver_suffix(build) => without_build,
        Some(_) => return None,
        None => version,
    };
    let core = match without_build.split_once('-') {
        Some((core, prerelease)) if is_semver_suffix(prerelease) => core,
        Some(_) => return None,
        None => without_build,
    };
    let parts: Vec<&str> = core.split('.').collect();
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

fn is_semver_suffix(value: &str) -> bool {
    !value.is_empty()
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || byte == b'.' || byte == b'-')
}

pub fn is_v0_semver_version(version: &str) -> bool {
    parse_semver(version)
        .map(|parsed| parsed.major == 0)
        .unwrap_or(false)
}

pub fn derive_current_v0_version_range(version: &str) -> Option<String> {
    let parsed = parse_semver(version)?;
    if parsed.major != 0 {
        return None;
    }
    Some(format!(">=0.{}.0 <0.{}.0", parsed.minor, parsed.minor + 1))
}

pub fn is_exact_contracts_package_version(version: &str) -> bool {
    version == CONTRACTS_PACKAGE_VERSION
}

pub fn satisfies_current_v0_version_range(version: &str, range: &str) -> bool {
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
    fn derives_current_v0_version_ranges() {
        assert_eq!(
            derive_current_v0_version_range("0.44.33").as_deref(),
            Some(">=0.44.0 <0.45.0")
        );
        assert!(satisfies_current_v0_version_range(
            "0.44.33",
            ">=0.44.0 <0.45.0"
        ));
        assert!(!satisfies_current_v0_version_range(
            "0.45.0",
            ">=0.44.0 <0.45.0"
        ));
    }

    #[test]
    fn derives_package_range_from_current_version() {
        let package_minor = CONTRACTS_PACKAGE_VERSION
            .split('.')
            .nth(1)
            .expect("package version should have a minor component")
            .parse::<u64>()
            .expect("package minor should be numeric");
        let next_line_version = format!("0.{}.0", package_minor + 1);

        assert_eq!(
            derive_current_v0_version_range(CONTRACTS_PACKAGE_VERSION).as_deref(),
            Some(format!(">=0.{package_minor}.0 <0.{}.0", package_minor + 1).as_str())
        );
        assert!(is_exact_contracts_package_version(
            CONTRACTS_PACKAGE_VERSION
        ));
        assert!(!is_exact_contracts_package_version(&next_line_version));
        assert!(satisfies_current_v0_version_range(
            CONTRACTS_PACKAGE_VERSION,
            &format!(">=0.{package_minor}.0 <0.{}.0", package_minor + 1)
        ));
        assert!(!satisfies_current_v0_version_range(
            &next_line_version,
            &format!(">=0.{package_minor}.0 <0.{}.0", package_minor + 1)
        ));
    }

    #[test]
    fn rejects_invalid_semver_inputs() {
        assert!(is_v0_semver_version("0.44.0-alpha.1+build.1"));
        assert!(!is_v0_semver_version("0.44"));
        assert!(!is_v0_semver_version("0.x.0"));
        assert!(!is_v0_semver_version("0.044.0"));
        assert!(!is_v0_semver_version("1.0.0"));
        assert_eq!(derive_current_v0_version_range("1.0.0"), None);
    }

    #[test]
    fn rejects_invalid_v0_range_inputs() {
        assert!(!satisfies_current_v0_version_range(
            "not-semver",
            ">=0.44.0 <0.45.0"
        ));
        assert!(!satisfies_current_v0_version_range(
            "1.0.0",
            ">=0.44.0 <0.45.0"
        ));
        assert!(!satisfies_current_v0_version_range("0.44.0", ">=0.44.0"));
        assert!(!satisfies_current_v0_version_range(
            "0.44.0",
            ">0.44.0 <0.45.0"
        ));
        assert!(!satisfies_current_v0_version_range(
            "0.44.0",
            ">=0.44.0 0.45.0"
        ));
        assert!(!satisfies_current_v0_version_range(
            "0.44.0",
            ">=bad <0.45.0"
        ));
        assert!(!satisfies_current_v0_version_range(
            "0.44.0",
            ">=0.44.0 <bad"
        ));
        assert!(!satisfies_current_v0_version_range(
            "0.44.0",
            ">=1.44.0 <1.45.0"
        ));
        assert!(!satisfies_current_v0_version_range(
            "0.44.0",
            ">=0.44.1 <0.45.0"
        ));
        assert!(!satisfies_current_v0_version_range(
            "0.44.0",
            ">=0.44.0 <0.45.1"
        ));
        assert!(!satisfies_current_v0_version_range(
            "0.44.0",
            ">=0.44.0 <0.46.0"
        ));
    }
}
