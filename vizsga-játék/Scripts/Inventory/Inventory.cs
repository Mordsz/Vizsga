using Godot;
using System;

public partial class Inventory : ItemList
{
	[Export] int inventorySize = 20;
	[Export] Texture2D blankIcon;

	private Item[] items;

	// Called when the node enters the scene tree for the first time.
	public override void _Ready()
	{
		items = new Item[inventorySize];

		for (int i = 0; i < inventorySize; i++)
		{
			AddItem(" ", blankIcon);
		}
	}
	public bool AddInventoryItem(Item item)
	{
		if (item == null || item.Qty <= 0) return false;
		bool couldPickup = AddStackableItem(item);
	}

	//Halmozható tárgyak esetén
	private bool AddStackableItem(Item item)
	{
		//Megpróbáljuk a meglévő stackekbe rakni
		bool couldPickup = false;

		for (int i = 0; i < items.Length; i++)
		{
			//Ha nincs itt tárgy, akkor lépünk a következőre
			if (items[i] == null) continue;
			//Ha nem ugyanaz a tárgy, vagy már maxon van a stack, akkor lépünk a következőre
			if (items[i].ID != item.ID || items[i].Qty >= items[i].MaxQty) continue;
			//Ha a hozzáadandó mennyiség több, mint amennyi még elférne a stackben
			if (items[i].Qty + item.Qty > items[i].MaxQty)
			{
				//A stacket feltöltjük maxra, a maradékot pedig visszaadjuk
				int amountToRemove = items[i].MaxQty - items[i].Qty;
				items[i].Qty = items[i].MaxQty;
				item.Qty -= amountToRemove;
				//Jelöljük, hogy sikerült felvenni valamit
				couldPickup = true;
				//Frissítjük a UI-t
				SetItemText(i, items[i].Qty.ToString());
				continue;
			}
			//Ha a hozzáadandó mennyiség elfér a stackben, akkor hozzáadjuk
			items[i].Qty = item.Qty + items[i].Qty;
			item.Qty = 0;
			SetItemText(i, items[i].Qty.ToString());
			return true;
		}
		return couldPickup;
	}
}
//Itemek osztálya
public class Item
{
	public int ID;
	public string Name;
	public Texture2D Icon;
	public int MaxQty;
	public int Qty;
}
