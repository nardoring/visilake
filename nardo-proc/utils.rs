use uuid::Uuid;
use log::{Level, LevelFilter, Metadata, Record};

pub fn use_localstack() -> bool {
    std::env::var("LOCALSTACK").unwrap_or_default() == "true"
}

pub fn _generate_request_id() -> String {
    Uuid::new_v4()
        .simple()
        .to_string()
        .chars()
        .take(8)
        .collect::<String>()
}

struct SimpleLogger;

impl log::Log for SimpleLogger {
    fn enabled(&self, metadata: &Metadata) -> bool {
        metadata.level() <= Level::Info
    }

    fn log(&self, record: &Record) {
        if self.enabled(record.metadata()) {
            println!("{} - {}", record.level(), record.args());
        }
    }

    fn flush(&self) {}
}

pub fn init_logging() {
    let logger: Box<dyn log::Log> = Box::new(SimpleLogger);
    let logger_ref: &'static dyn log::Log = Box::leak(logger);

    if let Err(err) = log::set_logger(logger_ref) {
        eprintln!("Failed to set logger: {}", err);
        return;
    }
    log::set_max_level(LevelFilter::Info);
}
