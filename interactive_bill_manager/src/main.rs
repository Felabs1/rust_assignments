use std::collections::HashMap;
use std::io;

// i want to add bills(User Input function)
fn get_input() -> Option<String> {
    let mut buffer = String::new();
    while io::stdin().read_line(&mut buffer).is_err() {
        println!("please enter your data again")
    }
    let input = buffer.trim().to_owned();
    if input.is_empty() {
        None
    } else {
        Some(input)
    }
}


// we should take a mutable reference to the hashmap because we need permission to modify it
fn add_bill(bills: &mut HashMap<String, f64>) {
    println!("bill name: ");

    let name = match get_input() {
        Some(input) => input,
        None => return,
    };

    println!("Amount: ");
    let amount_input = match get_input() {
        Some(input) => input,
        None => return,
    };

    // we are now going to try and parse the amount
    let amount: f64 = match amount_input.parse() {
        Ok(val) => val, // if successful, bind the float to amount
        Err(_) => {
            println!("Invalid amount, please type a number ");
            return;
        }
    };

    // saving to the hashmap
    bills.insert(name, amount);
    println!("bill added");
}

// reading the data, here we just need the immutable &
fn view_bills(bills: &HashMap<String, f64>) {
    // checking if the hashmap has zero items
    if bills.is_empty() {
        println!("no bills to display");
        return;
    }

    println!("\n==current bills==");

    // looping through each hashmap to get the 
    for (name, amount) in bills {
        println!("{}: ${:.2}", name, amount);
    }
}

fn remove_bill(bills: &mut HashMap<String, f64>) {
    view_bills(bills);

    if bills.is_empty() {
        return;
    }

    println!("enter bill name to remove ");

    let name = match get_input() {
        Some(input) => input,
        None => return,
    };

    if bills.remove(&name).is_some() {
        println!("Bill removed ");
    } else {
        println!("Bill not found");
    }
}


// edit our bills

fn edit_bill(bills: &mut HashMap<String, f64>) {
    view_bills(bills);
    if bills.is_empty() {
        return;
    }

    println!("Enter bill name to edit (or type 'back' to cancel):");
    let name = match get_input() {
        Some(input) => input,
        None => return,
    };

    // go back if i change my mind
    if name.to_lowercase() == "back" {
        return;
    }

    if bills.contains_key(&name) {
        println!("new amount:");
        let amount_input = match get_input() {
            Some(input) => input,
            None => return,
        };

        let amount:f64 = match amount_input.parse() {
            Ok(val) => val,
            Err(_) => {
                println!("Invalid amount.");
                return;
            }
        };

        bills.insert(name, amount);
        println!("Bill updated");
    } else {
        println!("Bill not found");
    }
}

// our entry point
fn main() {
    let mut bills:HashMap<String, f64> = HashMap::new();

    // creating our infine toop, the program stays alive inside this block
    loop {
        println!("\n== Manage Bills ==");
        println!("1. Add bill");
        println!("2. View bill");
        println!("3. Remove bill");
        println!("4. Edit bill");
        println!("5. Quit");
        println!("Enter selection");

        let input = match get_input() {
            Some(input) => input,
            None => continue,
        };

        // we check what the user typed by turning the string into a string slice
        match input.as_str() {
            "1" => add_bill(&mut bills),
            "2" => view_bills(&mut bills),
            "3" => remove_bill(&mut bills),
            "4" => edit_bill(&mut bills),
            "5" => {
                println!("Goodbye!");
                break;
            },
            _ => println!("invalid selection please try again."),
        }
    }
}