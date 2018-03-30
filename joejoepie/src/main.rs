#![allow(dead_code)]
// EXTERNAL IMPORTS
extern crate serde; 
extern crate serde_json;

#[macro_use]
extern crate serde_derive;

// MODULES
mod gamestate;
mod command;
mod bots;

fn main() {
    let mut c = command::Commands::new();
    let m = command::Move::new("lol", "lol", 5);
    c.add_move(m);

    let s = r#"{"planets":[{"ship_count":2,"x":-6.0,"y":0.0,"owner":1,"name":"protos"},{"ship_count":2,"x":-3.0,"y":5.0,"owner":null,"name":"duteros"},{"ship_count":2,"x":3.0,"y":5.0,"owner":null,"name":"tritos"},{"ship_count":2,"x":6.0,"y":0.0,"owner":2,"name":"tetartos"},{"ship_count":2,"x":3.0,"y":-5.0,"owner":null,"name":"pemptos"},{"ship_count":2,"x":-3.0,"y":-5.0,"owner":null,"name":"extos"},{"ship_count":4,"x":0.0,"y":0.0,"owner":null,"name":"helios"}],"expeditions":[]}"#;


    let test = gamestate::Gamestate::new(s);


    println!("{:?}", test);

}
