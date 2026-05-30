use soroban_sdk::{contracttype, Address, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Token,
    AuctionData,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AuctionData {
    pub deadline: u64,
    pub highest_bidder: Option<Address>,
    pub highest_bid: i128,
    pub is_active: bool,
    pub bidders: Vec<Address>,
}
