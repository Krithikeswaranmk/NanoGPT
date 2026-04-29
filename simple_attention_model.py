import torch
from torch import nn


torch.manual_seed(42)


class TinyAttentionModel(nn.Module):
    def __init__(self, vocab_size: int = 10, d_model: int = 32, num_heads: int = 4):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, d_model)
        self.attention = nn.MultiheadAttention(d_model, num_heads, batch_first=True)
        self.norm = nn.LayerNorm(d_model)
        self.classifier = nn.Linear(d_model, 1)

    def forward(self, tokens: torch.Tensor):
        x = self.embedding(tokens)
        attn_out, attn_weights = self.attention(
            x,
            x,
            x,
            need_weights=True,
            average_attn_weights=False,
        )
        x = self.norm(x + attn_out)
        pooled = x.mean(dim=1)
        logits = self.classifier(pooled).squeeze(-1)
        return logits, attn_weights


def make_batch(batch_size: int, seq_len: int, vocab_size: int, target_token: int = 7):
    tokens = torch.randint(0, vocab_size, (batch_size, seq_len))
    labels = (tokens == target_token).any(dim=1).float()
    return tokens, labels


def main():
    vocab_size = 10
    seq_len = 8
    target_token = 7

    model = TinyAttentionModel(vocab_size=vocab_size)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    loss_fn = nn.BCEWithLogitsLoss()

    for step in range(1, 301):
        tokens, labels = make_batch(64, seq_len, vocab_size, target_token)
        logits, _ = model(tokens)
        loss = loss_fn(logits, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        if step % 50 == 0:
            with torch.no_grad():
                predictions = (torch.sigmoid(logits) > 0.5).float()
                accuracy = (predictions == labels).float().mean().item()
            print(f"step={step:03d} loss={loss.item():.4f} accuracy={accuracy:.3f}")

    with torch.no_grad():
        sample = torch.tensor(
            [
                [1, 2, 3, 4, 5, 6, 7, 8],
                [1, 2, 3, 4, 5, 6, 8, 9],
            ]
        )
        logits, attn_weights = model(sample)
        probs = torch.sigmoid(logits)

        print("\nSample predictions:")
        for row, prob in zip(sample.tolist(), probs.tolist()):
            print(row, "->", f"{prob:.3f}")

        print("\nAttention shape:", tuple(attn_weights.shape))
        print("First head attention for first sample:")
        print(attn_weights[0, 0])


if __name__ == "__main__":
    main()
