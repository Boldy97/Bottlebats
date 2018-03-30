use serde_json;

#[derive(Serialize)]
pub struct Commands {
    moves: Vec<Move>,
}

#[derive(Serialize)]
pub struct Move {
    origin: String,
    destination: String,
    ship_count: usize
}

impl Commands {
    pub fn new() -> Self {
        Commands {
            moves: Vec::<Move>::new()
        }
    }
    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap()
    }
    pub fn add_move(&mut self, play_move: Move) {
        self.moves.push(play_move);
    }
}
impl Move {
    pub fn new(origin: &str, destination: &str, ship_count: usize) -> Self {
        Self {
            origin: String::from(origin),
            destination: String::from(destination),
            ship_count
        }
    }
}