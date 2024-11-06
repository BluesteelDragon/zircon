import { Players } from "@rbxts/services";
import type { ZrInstanceUserdata } from "@rbxts/zirconium/out/Data/Userdata";

import ZirconServer from "Server";

import { StatefulZirconValidator } from "../StatefulZirconValidator";
import { OptionalValidator } from "./OptionalValidator";

export class ZirconFuzzyPlayersValidator extends StatefulZirconValidator<
	Array<ZrInstanceUserdata<Player>> | number | string,
	ReadonlyArray<Player>
> {
	public playerRef = new Array<Player>();

	constructor() {
		super("Player[]");
	}

	// eslint-disable-next-line max-lines-per-function -- a 7
	public Validate(
		value: unknown,
		executingPlayer?: Player,
	): value is Array<ZrInstanceUserdata<Player>> | number | string {
		this.playerRef = [];
		if (typeIs(value, "string")) {
			if (value.find("^@", 1)[0] !== undefined) {
				const id = value.sub(2);
				if (id === "me" && executingPlayer !== undefined) {
					this.playerRef = [executingPlayer];
					return true;
				}

				const [group] = ZirconServer.Registry.GetGroups([id]);
				if (group !== undefined) {
					for (const member of group.GetMembers()) {
						this.playerRef.push(member);
					}

					return true;
				}
			}

			const matchingPlayers = Players.GetPlayers().filter(
				player => player.Name.lower().find(value.lower(), 1, true)[0] !== undefined,
			);
			for (const matchingPlayer of matchingPlayers) {
				this.playerRef.push(matchingPlayer);
			}
		} else if (typeIs(value, "number")) {
			const userIdPlayer = Players.GetPlayerByUserId(value);
			if (userIdPlayer) {
				this.playerRef = [userIdPlayer];
				return true;
			}
		}

		return this.playerRef.size() > 0;
	}

	public Transform(): Array<Player> {
		assert(this.playerRef, "Transform called before Validate, perhaps?");
		return this.playerRef;
	}
}

export const ZirconFuzzyPlayers = new ZirconFuzzyPlayersValidator();
export const OptionalZirconFuzzyPlayer = new OptionalValidator(ZirconFuzzyPlayers);
ZirconFuzzyPlayers;
