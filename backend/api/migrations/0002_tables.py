import django.db.models.deletion
from django.db import migrations, models

import api.models


class Migration(migrations.Migration):
    dependencies = [("api", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="Table",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("label", models.CharField(help_text="Örn. 5, Bahçe 2, Teras A", max_length=20)),
                ("token", models.CharField(default=api.models.new_table_token, editable=False, max_length=20, unique=True)),
                ("position", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("business", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tables", to="api.business")),
            ],
            options={"verbose_name": "Masa", "verbose_name_plural": "Masalar", "ordering": ["position", "id"]},
        ),
        migrations.AddConstraint(
            model_name="table",
            constraint=models.UniqueConstraint(fields=("business", "label"), name="unique_table_label"),
        ),
        migrations.RenameField(model_name="waitercall", old_name="table_number", new_name="table_label"),
        migrations.AlterField(model_name="waitercall", name="table_label", field=models.CharField(max_length=20)),
        migrations.AddField(
            model_name="waitercall",
            name="table",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="calls", to="api.table"),
        ),
    ]
