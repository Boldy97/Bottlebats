use std::collections::HashMap;
use serde_json;

type ScoreMap = HashMap<String, f64>;

#[derive(Debug, Deserialize)]
pub struct Gamestate {
    planets: Vec<Planet>,
    expeditions: Vec<Expedition>,
    #[serde(skip_deserializing)]
    my_planets: Vec<String>
}

#[derive(Debug, Deserialize)]
pub struct Planet {
    ship_count: usize,
    x: f64,
    y: f64,
    owner: Option<u8>,
    name: String
}

#[derive(Debug, Deserialize)]
pub struct Expedition {
    id: usize,
    ship_count: usize,
    origin: String,
    destination: String,
    owner: Option<u8>,
    turns_remaining: usize
}

impl Gamestate {
    pub fn new(json: &str) -> Self {
        let mut ret: Self = serde_json::from_str(json).unwrap();
        for p in ret.planets.iter() {
            if let Some(val) = p.owner {
                if val == 1 {
                    ret.my_planets.push(p.name.clone());
                }
            }
        }

        ret
    }

    fn calc_expeditions(&self, m: &mut ScoreMap) {
        for exp in self.expeditions.iter() {
            // The ship_count - turns_remaining could also be a '/', we'll have to see how it turns out
            *m.get_mut(exp.destination.as_str()).unwrap() -= (exp.ship_count - exp.turns_remaining) as f64;
        }
    }

    fn calc_hometroops(&self, m: &mut ScoreMap) {
        for p in self.planets.iter() {
            //*m.get_mut(p.name).unwrap() -= 
        }
    }

    pub fn is_my_planet(&self, name: &str) {
    }

    pub fn score(&self) -> ScoreMap {
        let mut ret = HashMap::new();
        self.calc_expeditions(&mut ret);

        ret
    }
}