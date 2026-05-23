use soroban_sdk::{contract, contractimpl, Address, Env, String};

use crate::{
    error::ContractError,
    events::{Approval, Burn, Mint, Transfer},
    storage::{AllowanceKey, DataKey},
};

#[contract]
pub struct SibToken;

#[contractimpl]
impl SibToken {

    // implementing the mint functionality on constructor
    pub fn __constructor(env: Env, admin: Address, initial_supply: i128) {
        // Persisting the admin so mint() can stay admin-gated post-deploy
        env.storage().persistent().set(&DataKey::Admin, &admin);

        // Minting the initial supply straight to the admin's balance
        env.storage()
            .persistent()
            .set(&DataKey::Balance(admin.clone()), &initial_supply);

        Mint {
            to: admin,
            amount: initial_supply,
        }
        .publish(&env);
    }
    
    // we are going to intitialize the contract with an admin address that is allowed to mint
    pub fn initialize(env: Env, admin: Address) {
        env.storage().persistent().set(&DataKey::Admin, &admin);
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(id))
            .unwrap_or(0)
    }

    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Allowance(AllowanceKey { from, spender }))
            .unwrap_or(0)
    }

    pub fn decimals(_env: Env) -> u32 {
        18
    }

    pub fn name(env: Env) -> String {
        String::from_str(&env, "SibToken")
    }

    pub fn symbol(env: Env) -> String {
        String::from_str(&env, "SIB")
    }

    pub fn approve(
        env: Env,
        from: Address,
        spender: Address,
        amount: i128,
        live_until_ledger: u32,
    ) -> Result<(), ContractError> {
        if amount < 0 {
            return Err(ContractError::NegativeAmount);
        }

        from.require_auth();

        let key = DataKey::Allowance(AllowanceKey {
            from: from.clone(),
            spender: spender.clone(),
        });

        env.storage().persistent().set(&key, &amount);

        if amount > 0 {
            env.storage()
                .persistent()
                .extend_ttl(&key, live_until_ledger, live_until_ledger);
        }

        Approval {
            from,
            spender,
            amount,
            live_until_ledger,
        }
        .publish(&env);

        Ok(())
    }

    pub fn transfer(
        env: Env,
        from: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), ContractError> {
        if amount < 0 {
            return Err(ContractError::NegativeAmount);
        }

        from.require_auth();

        let sender_balance = Self::balance(env.clone(), from.clone());

        if sender_balance < amount {
            return Err(ContractError::InsufficientFunds);
        }

        let receiver_balance = Self::balance(env.clone(), to.clone());

        // FIX: use address-based DataKey, not the raw balance value
        env.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &(sender_balance - amount));

        env.storage()
            .persistent()
            .set(&DataKey::Balance(to.clone()), &(receiver_balance + amount));

        Transfer { from, to, amount }.publish(&env);

        Ok(())
    }

// the transfer from function with respect to sep41 token
    pub fn transfer_from(
        env: Env,
        spender: Address,
        from: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), ContractError> {
        if amount < 0 {
            return Err(ContractError::NegativeAmount);
        }

        spender.require_auth();

        let allowance = Self::allowance(env.clone(), from.clone(), spender.clone());

        if allowance < amount {
            return Err(ContractError::InsufficientAllowance);
        }

        let sender_balance = Self::balance(env.clone(), from.clone());

        if sender_balance < amount {
            return Err(ContractError::InsufficientFunds);
        }

        let receiver_balance = Self::balance(env.clone(), to.clone());

        // Deduct allowance
        let allowance_key = DataKey::Allowance(AllowanceKey {
            from: from.clone(),
            spender: spender.clone(),
        });
        env.storage()
            .persistent()
            .set(&allowance_key, &(allowance - amount));

        // Move tokens
        env.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &(sender_balance - amount));
        env.storage()
            .persistent()
            .set(&DataKey::Balance(to.clone()), &(receiver_balance + amount));

        Transfer { from, to, amount }.publish(&env);

        Ok(())
    }


    // implementing burn mechanism
    pub fn burn(env: Env, from: Address, amount: i128) -> Result<(), ContractError> {
        if amount < 0 {
            return Err(ContractError::NegativeAmount);
        }

        from.require_auth();

        let bal = Self::balance(env.clone(), from.clone());

        if bal < amount {
            return Err(ContractError::InsufficientFunds);
        }

        env.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &(bal - amount));

        Burn { from, amount }.publish(&env);

        Ok(())
    }


    // implementing burn from
     pub fn burn_from(
        env: Env,
        spender: Address,
        from: Address,
        amount: i128,
    ) -> Result<(), ContractError> {
        if amount < 0 {
            return Err(ContractError::NegativeAmount);
        }

        spender.require_auth();

        let allowance = Self::allowance(env.clone(), from.clone(), spender.clone());

        if allowance < amount {
            return Err(ContractError::InsufficientAllowance);
        }

        let bal = Self::balance(env.clone(), from.clone());

        if bal < amount {
            return Err(ContractError::InsufficientFunds);
        }

        // Deduct allowance
        let allowance_key = DataKey::Allowance(AllowanceKey {
            from: from.clone(),
            spender: spender.clone(),
        });
        env.storage()
            .persistent()
            .set(&allowance_key, &(allowance - amount));

        // Burn tokens
        env.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &(bal - amount));

        Burn { from, amount }.publish(&env);

        Ok(())
    }

    // implementing mint function
     pub fn mint(env: Env, to: Address, amount: i128) -> Result<(), ContractError> {
        if amount < 0 {
            return Err(ContractError::NegativeAmount);
        }

        // Only the admin set during initialize() may mint
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("contract not initialized");

        admin.require_auth();

        let current = Self::balance(env.clone(), to.clone());

        env.storage()
            .persistent()
            .set(&DataKey::Balance(to.clone()), &(current + amount));

        Mint { to, amount }.publish(&env);

        Ok(())
    }



}