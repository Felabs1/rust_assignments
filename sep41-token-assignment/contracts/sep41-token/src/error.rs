use soroban_sdk::contracterror;

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ContractError {
    InsufficientFunds = 1,
    InsufficientAllowance = 2,
    NegativeAmount = 3,
    Unauthorized = 4,
}
