using Godot;
using System;

public partial class Wood : Area2D
{
    [Export]
    public int WoodValue = 1;

    public override void _Ready()
    {
        // Beállítjuk, hogy ha valaki belép a triggerbe, akkor meghívódjon az OnBodyEntered
        BodyEntered += OnBodyEntered;
        
    }

    private void OnBodyEntered(Node2D body)
    {
        if (body is Player player)
        {
            player.AddWood(WoodValue);
            QueueFree(); // eltünteti a fát a pályáról

        }
    }

    private void WoodRegrow()
    {
        //A fa újranő
        
    }

}
