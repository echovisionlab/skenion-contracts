use std::env;

fn parse_v0_semver(version: &str) -> Option<()> {
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
    let mut parts = core.split('.');
    let major = parse_semver_part(parts.next()?)?;
    parse_semver_part(parts.next()?)?;
    parse_semver_part(parts.next()?)?;
    if parts.next().is_some() || major != 0 {
        return None;
    }
    Some(())
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

fn main() {
    let package_version =
        env::var("CARGO_PKG_VERSION").expect("Cargo must provide CARGO_PKG_VERSION");
    assert!(
        parse_v0_semver(&package_version).is_some(),
        "skenion-contracts package version must be v0 SemVer major.minor.patch"
    );

    println!("cargo:rerun-if-changed=Cargo.toml");
}
