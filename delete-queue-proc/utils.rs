pub fn use_localstack() -> bool {
    std::env::var("LOCALSTACK").unwrap_or_default() == "true"
}
