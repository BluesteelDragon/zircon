import { ZrInstanceUserdata } from "@cwyvern/zirconium/out/data/userdata";

import { StatefulZirconValidator } from "../StatefulZirconValidator";
import { OptionalValidator } from "./OptionalValidator";

export class ZirconFuzzyPlayerValidator extends StatefulZirconValidator<
	number | string | ZrInstanceUserdata<Player>,
	Player
> {
	public playerRef?: Player;

	constructor() {
		super("Player");
	}

	public Validate(value: unknown): value is number | string | ZrInstanceUserdata<Player> {
		if (typeIs(value, "string")) {
			const existingPlayer = game
				.GetService("Players")
				.GetPlayers()
				.find(player => player.Name.sub(1, value.size()).lower() === value.lower());
			if (existingPlayer) {
				this.playerRef = existingPlayer;
				return true;
			}
		} else if (typeIs(value, "number")) {
			const player = game.GetService("Players").GetPlayerByUserId(value);
			if (player) {
				this.playerRef = player;
				return true;
			}
		} else if (value instanceof ZrInstanceUserdata && value.isA("Player")) {
			this.playerRef = value.value();
			return true;
		}

		return false;
	}

	public Transform(): Player {
		assert(this.playerRef, "Transform called before Validate, perhaps?");
		return this.playerRef;
	}
}

export const ZirconFuzzyPlayer = new ZirconFuzzyPlayerValidator();
export const OptionalZirconFuzzyPlayer = new OptionalValidator(ZirconFuzzyPlayer);
