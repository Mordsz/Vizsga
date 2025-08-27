using Godot;
using System;
using System.Security.Cryptography.X509Certificates;

public partial class Inventory : ItemList
{
	[Export] int inventorySize = 20;
	[Export] Texture2D blankIcon;

	private Item[] items;
	
	
	public override void _Process(double delta)
	{
		
		if (Input.IsActionJustPressed("ui_inventory"))
			Visible = !Visible;
	}

	// Called when the node enters the scene tree for the first time.
	public override void _Ready()
	{
		//Alapértelmezésben rejtve van az inventory
		Visible = false;

		items = new Item[inventorySize];

		for (int i = 0; i < inventorySize; i++)
		{
			AddItem(" ", blankIcon);
		}

		ItemClicked += OnInventoryItemClicked;
	}
	//Tárgy hozzáadása az inventoryhoz
	public bool AddInventoryItem(Item item)
	{
		if (item == null || item.Qty <= 0) return false;

		bool couldPickup = AddStackableItem(item);

		if (item.Qty <= 0) return true;

		//Ha nem halmozható a tárgy, vagy nem fért el a meglévő stackekben, akkor új helyre tesszük
		for (int i = 0; i < inventorySize; i++)
		{
			if (items[i] != null) continue;
			items[i] = item;
			SetItemIcon(i, item.Icon);

			if (item.MaxQty > 1)
			{
				SetItemText(i, item.Qty.ToString());
			}
			return true;
		}
		return couldPickup;
	}

		//Tárgy eltávolítása az inventoryból
	public void RemoveInventoryItem(int index)
	{
		if (index < 0 || index >= inventorySize) return;
		items[index] = null;
		SetItemIcon(index, blankIcon);
		SetItemText(index, " ");
	}
		//Tárgy lekérése az inventoryból
	public Item GetInventoryItem(int index)
	{
		if (index < 0 || index >= inventorySize) return null;

		return items[index];
	}

	private void OnInventoryItemClicked(long index, Vector2 pos, long mouseButtonIndex)
	{
		if (mouseButtonIndex == 2) //Jobb klikk
		{
			Item item = GetInventoryItem((int)index);

			if (item == null)
			{
				GD.Print("Nincs tárgy a kijelölt helyen.");
				return;
			}

			RemoveInventoryItem((int)index);

			GD.Print($"Eldobtál { item.Qty}  {item.Name}.");
		}
		else if (mouseButtonIndex == 1) //Bal klikk
		{
			Item item = GetInventoryItem((int)index);

			if (item == null)
			{
				GD.Print("Nincs tárgy a kijelölt helyen.");
				return;
			}
			GD.Print($"A {item.Name} nevű tárgyból van {item.Qty} db összesen.");
		}
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
